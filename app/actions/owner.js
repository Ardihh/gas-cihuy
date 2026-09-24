"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "../../lib/api.js";
import { getCurrentUser } from "../../lib/auth.js";
import {
  OwnerServiceError,
  createItem,
  deleteItem,
  updateRentalStatus,
} from "../../lib/owner.js";

const UNAUTHORIZED_MSG = "Akses ditolak. Hanya pemilik toko yang dapat melakukan aksi ini.";

async function verifyOwner() {
  const currentUser = await getCurrentUser();

  if (currentUser.status !== "authenticated" || !currentUser.user) {
    redirect("/login");
  }

  if (currentUser.user.role !== "admin") {
    return { authorized: false };
  }

  return { authorized: true, user: currentUser.user };
}

function readFormValue(formData, field) {
  const value = formData?.get(field);
  return typeof value === "string" ? value : "";
}

export async function approveRentalAction(_previousState, formData) {
  const auth = await verifyOwner();
  if (!auth.authorized) return { status: "error", error: UNAUTHORIZED_MSG };

  const rentalId = Number(readFormValue(formData, "rentalId"));
  const adminNote = readFormValue(formData, "adminNote");

  try {
    await updateRentalStatus(rentalId, "approved", adminNote || null);
    revalidatePath("/owner");
    return { status: "success", message: "Rental berhasil disetujui." };
  } catch (error) {
    if (error instanceof OwnerServiceError && error.code === "INVALID_INPUT") {
      return { status: "error", error: "Data tidak valid." };
    }
    if (error instanceof ApiError) {
      return { status: "error", error: `Gagal memperbarui rental: ${error.message}` };
    }
    return { status: "error", error: "Gagal memperbarui status rental. Coba lagi." };
  }
}

export async function rejectRentalAction(_previousState, formData) {
  const auth = await verifyOwner();
  if (!auth.authorized) return { status: "error", error: UNAUTHORIZED_MSG };

  const rentalId = Number(readFormValue(formData, "rentalId"));
  const adminNote = readFormValue(formData, "adminNote");

  try {
    await updateRentalStatus(rentalId, "rejected", adminNote || null);
    revalidatePath("/owner");
    return { status: "success", message: "Rental berhasil ditolak." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", error: `Gagal memperbarui rental: ${error.message}` };
    }
    return { status: "error", error: "Gagal menolak rental. Coba lagi." };
  }
}

export async function updateRentalStatusAction(_previousState, formData) {
  const auth = await verifyOwner();
  if (!auth.authorized) return { status: "error", error: UNAUTHORIZED_MSG };

  const rentalId = Number(readFormValue(formData, "rentalId"));
  const status = readFormValue(formData, "status");
  const adminNote = readFormValue(formData, "adminNote");

  try {
    await updateRentalStatus(rentalId, status, adminNote || null);
    revalidatePath("/owner");
    return { status: "success", message: `Status rental berhasil diperbarui ke "${status}".` };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", error: `Gagal memperbarui rental: ${error.message}` };
    }
    return { status: "error", error: "Gagal memperbarui status rental. Coba lagi." };
  }
}

export async function createItemAction(_previousState, formData) {
  const auth = await verifyOwner();
  if (!auth.authorized) return { status: "error", error: UNAUTHORIZED_MSG };

  const input = {
    name: readFormValue(formData, "name"),
    category: readFormValue(formData, "category"),
    description: readFormValue(formData, "description"),
    size: readFormValue(formData, "size"),
    pricePerDay: readFormValue(formData, "pricePerDay"),
    stock: readFormValue(formData, "stock"),
    imageUrl: readFormValue(formData, "imageUrl"),
  };

  if (!input.name.trim() || !input.category || !input.description.trim() || !input.size.trim() || !input.imageUrl.trim()) {
    return { status: "error", error: "Semua field wajib diisi." };
  }

  try {
    await createItem(input);
    revalidatePath("/owner");
    revalidatePath("/catalog");
    revalidatePath("/");
    return { status: "success", message: `Koleksi "${input.name}" berhasil ditambahkan.` };
  } catch (error) {
    if (error instanceof OwnerServiceError && error.code === "INVALID_INPUT") {
      return { status: "error", error: error.message };
    }
    if (error instanceof ApiError) {
      return { status: "error", error: `Gagal menambahkan item: ${error.message}` };
    }
    return { status: "error", error: "Gagal menambahkan koleksi. Coba lagi." };
  }
}

export async function deleteItemAction(_previousState, formData) {
  const auth = await verifyOwner();
  if (!auth.authorized) return { status: "error", error: UNAUTHORIZED_MSG };

  const itemId = Number(readFormValue(formData, "itemId"));

  try {
    await deleteItem(itemId);
    revalidatePath("/owner");
    revalidatePath("/catalog");
    revalidatePath("/");
    return { status: "success", message: "Item berhasil dihapus dari koleksi." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", error: `Gagal menghapus item: ${error.message}` };
    }
    return { status: "error", error: "Gagal menghapus item. Coba lagi." };
  }
}
