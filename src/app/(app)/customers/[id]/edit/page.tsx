import * as React from "react";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/server/customers";
import { CustomerEditForm } from "./CustomerEditForm";

interface CustomerEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerEditPage({
  params,
}: CustomerEditPageProps) {
  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) {
    notFound();
  }

  return <CustomerEditForm customer={customer} />;
}
