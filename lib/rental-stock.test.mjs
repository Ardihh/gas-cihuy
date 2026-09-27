import assert from "node:assert/strict";
import test from "node:test";

import {
  RentalAvailabilityError,
  RentalStockSynchronizationError,
  RentalStatusTransitionError,
  createRentalWithStock,
  updateRentalStatusWithStock,
} from "./rental-stock.mjs";

function createInventory(initialStock, status = "available") {
  const item = {
    id: 21,
    name: "Miku Costume",
    category: "Anime",
    description: "Kostum lengkap.",
    size: "M",
    pricePerDay: 125000,
    stock: initialStock,
    imageUrl: "https://example.com/miku.jpg",
    status,
  };
  const updates = [];

  return {
    item,
    updates,
    async getItem(itemId) {
      assert.equal(itemId, item.id);
      return { ...item };
    },
    async updateItem(itemId, input) {
      assert.equal(itemId, item.id);
      updates.push(input);
      Object.assign(item, input);
      return { success: true };
    },
  };
}

function rental(status, quantity = 2) {
  return {
    id: 301,
    itemId: 21,
    quantity,
    status,
    adminNote: null,
  };
}

test("creates rental then decrements the latest stock by the requested quantity", async () => {
  const inventory = createInventory(5);
  const events = [];

  const created = await createRentalWithStock({
    itemId: 21,
    quantity: 2,
    getItem: async (...args) => {
      events.push("GET item");
      return inventory.getItem(...args);
    },
    createRental: async () => {
      events.push("POST rental");
      return { rental: rental("pending") };
    },
    updateItem: async (...args) => {
      events.push("PUT item");
      return inventory.updateItem(...args);
    },
  });

  assert.equal(created.rental.status, "pending");
  assert.equal(inventory.item.stock, 3);
  assert.deepEqual(events, ["GET item", "POST rental", "GET item", "PUT item"]);
  assert.equal(inventory.updates[0].status, "available");
});

test("rejects a rental above stock without posting or updating stock", async () => {
  const inventory = createInventory(1);
  let postCount = 0;

  await assert.rejects(
    createRentalWithStock({
      itemId: 21,
      quantity: 2,
      getItem: inventory.getItem,
      createRental: async () => {
        postCount += 1;
      },
      updateItem: inventory.updateItem,
    }),
    RentalAvailabilityError,
  );

  assert.equal(postCount, 0);
  assert.equal(inventory.updates.length, 0);
  assert.equal(inventory.item.stock, 1);
});

test("rejects an unavailable item even when it has positive stock", async () => {
  const inventory = createInventory(5, "unavailable");
  let postCount = 0;

  await assert.rejects(
    createRentalWithStock({
      itemId: 21,
      quantity: 1,
      getItem: inventory.getItem,
      createRental: async () => {
        postCount += 1;
      },
      updateItem: inventory.updateItem,
    }),
    RentalAvailabilityError,
  );

  assert.equal(postCount, 0);
  assert.equal(inventory.updates.length, 0);
});

test("rejects a mismatched item response before creating a rental", async () => {
  const inventory = createInventory(5);
  let postCount = 0;

  await assert.rejects(
    createRentalWithStock({
      itemId: 21,
      quantity: 1,
      getItem: async () => ({ ...inventory.item, id: 22 }),
      createRental: async () => {
        postCount += 1;
      },
      updateItem: inventory.updateItem,
    }),
    RentalAvailabilityError,
  );

  assert.equal(postCount, 0);
  assert.equal(inventory.updates.length, 0);
});

test("uses the stock returned by the fresh read immediately before the item update", async () => {
  const inventory = createInventory(5);
  let getCount = 0;

  await createRentalWithStock({
    itemId: 21,
    quantity: 2,
    getItem: async (itemId) => {
      getCount += 1;
      if (getCount === 2) inventory.item.stock = 4;
      return inventory.getItem(itemId);
    },
    createRental: async () => ({ rental: rental("pending") }),
    updateItem: inventory.updateItem,
  });

  assert.equal(inventory.item.stock, 2);
  assert.equal(inventory.updates[0].stock, 2);
});

test("does not write a negative stock if availability changes after rental creation", async () => {
  const inventory = createInventory(5);
  let getCount = 0;

  await assert.rejects(
    createRentalWithStock({
      itemId: 21,
      quantity: 2,
      getItem: async (itemId) => {
        getCount += 1;
        if (getCount === 2) inventory.item.stock = 1;
        return inventory.getItem(itemId);
      },
      createRental: async () => ({ rental: rental("pending") }),
      updateItem: inventory.updateItem,
    }),
    (error) => error instanceof RentalStockSynchronizationError
      && error.operation === "decrement",
  );

  assert.equal(inventory.item.stock, 1);
  assert.equal(inventory.updates.length, 0);
});

test("does not change stock when rental creation fails", async () => {
  const inventory = createInventory(5);
  const postError = new Error("rental request rejected");

  await assert.rejects(
    createRentalWithStock({
      itemId: 21,
      quantity: 2,
      getItem: inventory.getItem,
      createRental: async () => {
        throw postError;
      },
      updateItem: inventory.updateItem,
    }),
    (error) => error === postError,
  );

  assert.equal(inventory.updates.length, 0);
  assert.equal(inventory.item.stock, 5);
});

test("does not change stock when rental API explicitly reports failure", async () => {
  const inventory = createInventory(5);

  await assert.rejects(
    createRentalWithStock({
      itemId: 21,
      quantity: 2,
      getItem: inventory.getItem,
      createRental: async () => ({ success: false }),
      updateItem: inventory.updateItem,
    }),
  );

  assert.equal(inventory.item.stock, 5);
  assert.equal(inventory.updates.length, 0);
});

test("sets an item unavailable when a successful rental reduces stock to zero", async () => {
  const inventory = createInventory(1);

  await createRentalWithStock({
    itemId: 21,
    quantity: 1,
    getItem: inventory.getItem,
    createRental: async () => ({ rental: rental("pending", 1) }),
    updateItem: inventory.updateItem,
  });

  assert.equal(inventory.item.stock, 0);
  assert.equal(inventory.item.status, "unavailable");
});

for (const [previousStatus, nextStatus] of [
  ["pending", "rejected"],
  ["pending", "cancelled"],
  ["approved", "cancelled"],
  ["ongoing", "returned"],
]) {
  test(`restores rental stock once for ${previousStatus} -> ${nextStatus}`, async () => {
    const inventory = createInventory(3);
    let persistedStatus = previousStatus;

    await updateRentalStatusWithStock({
      rental: rental(previousStatus),
      nextStatus,
      persistRentalStatus: async () => {
        persistedStatus = nextStatus;
        return { status: persistedStatus };
      },
      getItem: inventory.getItem,
      updateItem: inventory.updateItem,
    });

    assert.equal(persistedStatus, nextStatus);
    assert.equal(inventory.item.stock, 5);
    assert.equal(inventory.updates.length, 1);
  });
}

for (const [previousStatus, nextStatus] of [
  ["pending", "approved"],
  ["approved", "ongoing"],
]) {
  test(`does not restore stock for ${previousStatus} -> ${nextStatus}`, async () => {
    const inventory = createInventory(3);

    await updateRentalStatusWithStock({
      rental: rental(previousStatus),
      nextStatus,
      persistRentalStatus: async () => ({ status: nextStatus }),
      getItem: inventory.getItem,
      updateItem: inventory.updateItem,
    });

    assert.equal(inventory.item.stock, 3);
    assert.equal(inventory.updates.length, 0);
  });
}

test("rejects an invalid rental transition without changing status or stock", async () => {
  const inventory = createInventory(3);
  let statusUpdateCount = 0;

  await assert.rejects(
    updateRentalStatusWithStock({
      rental: rental("pending"),
      nextStatus: "returned",
      persistRentalStatus: async () => {
        statusUpdateCount += 1;
      },
      getItem: inventory.getItem,
      updateItem: inventory.updateItem,
    }),
    RentalStatusTransitionError,
  );

  assert.equal(statusUpdateCount, 0);
  assert.equal(inventory.item.stock, 3);
  assert.equal(inventory.updates.length, 0);
});

test("does not double-restore when a terminal rental status is updated again", async () => {
  for (const status of ["rejected", "returned"]) {
    const inventory = createInventory(3);
    let statusUpdateCount = 0;
    const previousStatus = status === "rejected" ? "pending" : "ongoing";

    await updateRentalStatusWithStock({
      rental: rental(previousStatus),
      nextStatus: status,
      persistRentalStatus: async () => {
        statusUpdateCount += 1;
      },
      getItem: inventory.getItem,
      updateItem: inventory.updateItem,
    });

    assert.equal(inventory.item.stock, 5);
    assert.equal(inventory.updates.length, 1);

    await updateRentalStatusWithStock({
      rental: rental(status),
      nextStatus: status,
      adminNote: "Catatan diperbarui.",
      persistRentalStatus: async () => {
        statusUpdateCount += 1;
      },
      getItem: inventory.getItem,
      updateItem: inventory.updateItem,
    });

    assert.equal(statusUpdateCount, 2);
    assert.equal(inventory.item.stock, 5);
    assert.equal(inventory.updates.length, 1);
  }
});

test("keeps an unavailable item unavailable when stock is restored from zero", async () => {
  const inventory = createInventory(0, "unavailable");

  await updateRentalStatusWithStock({
    rental: rental("ongoing"),
    nextStatus: "returned",
    persistRentalStatus: async () => ({ status: "returned" }),
    getItem: inventory.getItem,
    updateItem: inventory.updateItem,
  });

  assert.equal(inventory.item.stock, 2);
  assert.equal(inventory.item.status, "unavailable");
});

test("reports rental-created partial failure when the subsequent stock update fails", async () => {
  const inventory = createInventory(5);
  const postResult = { rental: rental("pending") };

  await assert.rejects(
    createRentalWithStock({
      itemId: 21,
      quantity: 2,
      getItem: inventory.getItem,
      createRental: async () => postResult,
      updateItem: async () => {
        throw new Error("item API unavailable");
      },
    }),
    (error) => error instanceof RentalStockSynchronizationError
      && error.operation === "decrement"
      && error.rental === postResult,
  );
});

test("reports explicit root or nested API failure responses from the stock update", async () => {
  for (const response of [{ success: false }, { data: { success: false } }]) {
    const inventory = createInventory(5);

    await assert.rejects(
      createRentalWithStock({
        itemId: 21,
        quantity: 2,
        getItem: inventory.getItem,
        createRental: async () => ({ rental: rental("pending") }),
        updateItem: async () => response,
      }),
      (error) => error instanceof RentalStockSynchronizationError
        && error.operation === "decrement",
    );

    assert.equal(inventory.item.stock, 5);
  }
});

test("reports status-updated partial failure when stock restoration fails", async () => {
  const inventory = createInventory(3);
  let persistedStatus = "pending";

  await assert.rejects(
    updateRentalStatusWithStock({
      rental: rental("pending"),
      nextStatus: "rejected",
      persistRentalStatus: async () => {
        persistedStatus = "rejected";
        return { status: persistedStatus };
      },
      getItem: inventory.getItem,
      updateItem: async () => {
        throw new Error("item API unavailable");
      },
    }),
    (error) => error instanceof RentalStockSynchronizationError
      && error.operation === "restore"
      && error.rentalId === 301,
  );

  assert.equal(persistedStatus, "rejected");
});

test("does not restore stock when the rental status update fails", async () => {
  const inventory = createInventory(3);
  const statusError = new Error("rental API unavailable");

  await assert.rejects(
    updateRentalStatusWithStock({
      rental: rental("pending"),
      nextStatus: "rejected",
      persistRentalStatus: async () => {
        throw statusError;
      },
      getItem: inventory.getItem,
      updateItem: inventory.updateItem,
    }),
    (error) => error === statusError,
  );

  assert.equal(inventory.item.stock, 3);
  assert.equal(inventory.updates.length, 0);
});

test("does not restore stock when the rental API explicitly reports status failure", async () => {
  const inventory = createInventory(3);

  await assert.rejects(
    updateRentalStatusWithStock({
      rental: rental("pending"),
      nextStatus: "rejected",
      persistRentalStatus: async () => ({ success: false }),
      getItem: inventory.getItem,
      updateItem: inventory.updateItem,
    }),
  );

  assert.equal(inventory.item.stock, 3);
  assert.equal(inventory.updates.length, 0);
});
