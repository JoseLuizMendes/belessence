/**
 * HealthProbe — porta (interface) do bounded context Health.
 *
 * Contrato mínimo (ISP): só `name` + `check()`. O use case depende DESTA
 * abstração (DIP). Somar uma sonda = novo adapter que implementa a porta (OCP).
 * Convenção: `check()` deve devolver ProbeResult; se lançar/pendurar, o use
 * case (runProbe) trata como `ok:false`.
 */
import type { ProbeResult } from "../../domain/health-types";

export interface HealthProbe {
  readonly name: string;
  check(): Promise<ProbeResult>;
}
