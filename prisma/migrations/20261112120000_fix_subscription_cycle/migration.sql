-- O fim do ciclo é inclusivo: início + 29 corresponde a 30 dias de validade.
UPDATE "subscription"
SET "cycle_end" = "cycle_start" + 29
WHERE "cycle_end" = "cycle_start" + 30;
