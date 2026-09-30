"use client";

/**
 * Disponibiliza as configurações do site (nome, WhatsApp, taxa de entrega...)
 * para componentes client. Os valores vêm do servidor via props (app/layout).
 */
import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { DEFAULT_SETTINGS } from "@/lib/config";
import type { Settings } from "@/types";

const SettingsContext = createContext<Settings>(DEFAULT_SETTINGS);

export function useSettings(): Settings {
  return useContext(SettingsContext);
}

export function SettingsProvider({
  settings,
  children,
}: {
  settings: Settings;
  children: ReactNode;
}) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}
