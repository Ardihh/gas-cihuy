"use server";

import { ApiError } from "../../lib/api.js";
import { AuthServiceError, getCurrentUser } from "../../lib/auth.js";
import { getCatalogItem } from "../../lib/catalog.js";
import {
  RentalInputError,
  RentalResponseError,
  cancelRental,
  createRental,
  validateRentalInput,
} from "../../lib/rentals.js";
import { isRentalAvailable } from "../../lib/rental-adapter.mjs";

const VALIDATION_ERROR = "Periksa tanggal dan jumlah sebelum mengajukan rental.";
const REQUEST_ERROR = "Pengajuan sewa tidak dapat diproses. Periksa kembali item, tanggal, dan jumlah.";
const AVAILABILITY_ERROR = "Item ini sedang tidak tersedia untuk disewa atau stok tidak mencukupi.";
const SERVICE_ERROR = "Layanan rental sedang tidak tersedia. Coba lagi nanti.";
const UNAUTHENTICATED_ERROR = "Silakan masuk untuk mengajukan rental.";
const CANCELLATION_ERROR = "Rental ini tidak dapat dibatalkan pada status sekarang.";

function readFormValue(formData, field) {
  const value = formData?.get(field);
  return typeof value === "string" ? value : "";
}

function unauthenticatedState() {
  return {
    status: "unauthenticated",
    error: UNAUTHENTICATED_ERROR,
  };
}

function serviceUnavailableState() {
  return {
    status: "service_unavailable",
    error: SERVICE_ERROR,
  };
}

function unavailableItemState() {
  return {
    status: "request_error",
    error: AVAILABILITY_ERROR,
  };
}

function mapRentalRequestError(error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return unauthenticatedState();
    }

    if (error.status === 400 || error.status === 409 || error.status === 422) {
      return {
        status: "request_error",
        error: REQUEST_ERROR,
      };
    }

    return serviceUnavailableState();
  }

  if (error instanceof RentalResponseError || error instanceof AuthServiceError) {
    return serviceUnavailableState();
  }

  return serviceUnavailableState();
}

export async function createRentalAction(itemId, _previousState, formData) {
  const input = {
    itemId,
    startDate: readFormValue(formData, "startDate"),
    endDate: readFormValue(formData, "endDate"),
    quantity: readFormValue(formData, "quantity"),
  };

  let normalizedInput;

  try {
    normalizedInput = validateRentalInput(input);
  } catch (error) {
    if (error instanceof RentalInputError) {
      return {
        status: "validation",
        error: VALIDATION_ERROR,
      };
    }

    return serviceUnavailableState();
  }

  let currentUser;

  try {
    currentUser = await getCurrentUser();
  } catch {
    return serviceUnavailableState();
  }

  if (currentUser.status !== "authenticated" || !currentUser.user) {
    return unauthenticatedState();
  }

  let item;

  try {
    item = await getCatalogItem(normalizedInput.itemId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return unavailableItemState();
    }

    return serviceUnavailableState();
  }

  if (!isRentalAvailable(item, normalizedInput.quantity)) {
    return unavailableItemState();
  }

  try {
    const result = await createRental({
      userId: currentUser.user.id,
      ...normalizedInput,
    });

    return {
      status: "success",
      result,
    };
  } catch (error) {
    return mapRentalRequestError(error);
  }
}

export async function cancelRentalAction(_previousState, formData) {
  let currentUser;

  try {
    currentUser = await getCurrentUser();
  } catch {
    return serviceUnavailableState();
  }

  if (currentUser.status !== "authenticated" || !currentUser.user) {
    return unauthenticatedState();
  }

  const rentalId = Number(readFormValue(formData, "rentalId"));

  try {
    await cancelRental(currentUser.user.id, rentalId);
    return { status: "success", message: "Rental berhasil dibatalkan." };
  } catch (error) {
    if (error instanceof RentalInputError) {
      return { status: "request_error", error: CANCELLATION_ERROR };
    }

    if (error instanceof ApiError) {
      if (error.status === 401) return unauthenticatedState();
      if ([400, 404, 409, 422].includes(error.status)) {
        return { status: "request_error", error: CANCELLATION_ERROR };
      }
    }

    return serviceUnavailableState();
  }
}
