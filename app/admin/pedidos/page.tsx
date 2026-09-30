"use client";

import { Suspense } from "react";
import PedidosClient from "./PedidosClient";

export default function AdminPedidosPage() {
  return (
    <Suspense fallback={null}>
      <PedidosClient />
    </Suspense>
  );
}
