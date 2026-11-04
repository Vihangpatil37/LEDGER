"use server";

import {
  loginAction as loginActionImpl,
  logoutAction as logoutActionImpl,
} from "./(auth)/login/actions";
import { requestPasswordResetAction as requestPasswordResetActionImpl } from "./(auth)/forgot-password/actions";
import { updatePasswordAction as updatePasswordActionImpl } from "./(auth)/reset-password/actions";
import {
  createCustomerAction as createCustomerActionImpl,
  setCustomerActiveAction as setCustomerActiveActionImpl,
  updateCustomerAction as updateCustomerActionImpl,
} from "./(app)/customers/actions";
import { createTransactionAction as createTransactionActionImpl } from "./(app)/entry/actions";
import { reverseTransactionAction as reverseTransactionActionImpl } from "./(app)/customers/[id]/actions";
import { updateSettingsAction as updateSettingsActionImpl } from "./(app)/settings/actions";

export async function loginAction(rawInput: unknown) {
  return loginActionImpl(rawInput);
}

export async function logoutAction() {
  return logoutActionImpl();
}

export async function requestPasswordResetAction(rawInput: unknown) {
  return requestPasswordResetActionImpl(rawInput);
}

export async function updatePasswordAction(rawInput: unknown) {
  return updatePasswordActionImpl(rawInput);
}

export async function createCustomerAction(rawInput: unknown) {
  return createCustomerActionImpl(rawInput);
}

export async function updateCustomerAction(rawInput: unknown) {
  return updateCustomerActionImpl(rawInput);
}

export async function setCustomerActiveAction(rawInput: unknown) {
  return setCustomerActiveActionImpl(rawInput);
}

export async function createTransactionAction(rawInput: unknown) {
  return createTransactionActionImpl(rawInput);
}

export async function reverseTransactionAction(rawInput: unknown) {
  return reverseTransactionActionImpl(rawInput);
}

export async function updateSettingsAction(rawInput: unknown) {
  return updateSettingsActionImpl(rawInput);
}
