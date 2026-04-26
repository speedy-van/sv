"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { getDriverEarnings, type DriverEarnings } from "@/lib/driver-api";

function formatGBP(n: number) {
  return `£${(n ?? 0).toFixed(2)}`;
}

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Box
      bg={highlight ? "rgba(212,175,55,0.07)" : "rgba(255,255,255,0.04)"}
      border="1px solid"
      borderColor={highlight ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.08)"}
      rounded="xl"
      p="4"
    >
      <Text
        fontFamily="body"
        color="muted"
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.06em"
      >
        {label}
      </Text>
      <Text
        fontFamily="heading"
        fontWeight="700"
        color={highlight ? "gold" : "pearl"}
        fontSize="2xl"
        mt="1"
      >
        {value}
      </Text>
      {sub && (
        <Text fontFamily="body" color="muted" fontSize="xs" mt="0.5">
          {sub}
        </Text>
      )}
    </Box>
  );
}

export default function DriverEarningsPage() {
  const [data, setData] = useState<DriverEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDriverEarnings()
      .then(setData)
      .catch(() => setError("Could not load earnings."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py="20">
        <Spinner color="gold" size="xl" borderWidth="3px" />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Stack align="center" py="20" gap="4">
        <Text fontFamily="body" color="crimson" fontSize="sm">
          {error ?? "No earnings data."}
        </Text>
        <Button
          size="sm"
          variant="outline"
          borderColor="glassBorder"
          color="pearl"
          onClick={load}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  const summary = data.summary;
  const history = data.earnings ?? [];

  return (
    <Stack gap="6">
      {/* Summary cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap="3">
        <SummaryCard
          label="Total earned"
          value={formatGBP(summary.totalEarnings)}
          highlight
        />
        <SummaryCard
          label="Paid out"
          value={formatGBP(summary.paidOut)}
          sub="In your bank"
        />
        <SummaryCard
          label="Pending"
          value={formatGBP(summary.pending)}
          sub="Processing"
        />
        <SummaryCard
          label="Jobs"
          value={String(summary.totalJobs ?? 0)}
          sub="Completed"
        />
      </SimpleGrid>

      {/* Earnings history */}
      <Stack gap="3">
        <Text
          fontFamily="body"
          color="muted"
          fontSize="xs"
          textTransform="uppercase"
          letterSpacing="0.06em"
        >
          Earnings history
        </Text>

        {history.length === 0 ? (
          <Box
            bg="rgba(255,255,255,0.03)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.07)"
            rounded="xl"
            p="10"
            textAlign="center"
          >
            <Text fontFamily="body" color="muted" fontSize="sm">
              No completed jobs yet.
            </Text>
          </Box>
        ) : (
          <Box
            bg="rgba(255,255,255,0.03)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.07)"
            rounded="xl"
            overflow="hidden"
          >
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row borderColor="rgba(255,255,255,0.07)">
                    {["Reference", "Date", "Status", "Amount"].map(
                      (h) => (
                        <Table.ColumnHeader
                          key={h}
                          color="muted"
                          fontFamily="body"
                          fontSize="xs"
                          textTransform="uppercase"
                          letterSpacing="0.06em"
                          fontWeight="600"
                          borderColor="rgba(255,255,255,0.07)"
                          px="4"
                          py="3"
                        >
                          {h}
                        </Table.ColumnHeader>
                      ),
                    )}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {history.map((row) => (
                    <Table.Row
                      key={row.id}
                      borderColor="rgba(255,255,255,0.05)"
                      _hover={{ bg: "rgba(255,255,255,0.02)" }}
                    >
                      <Table.Cell
                        fontFamily="mono"
                        color="gold"
                        fontSize="xs"
                        px="4"
                        py="3"
                        borderColor="rgba(255,255,255,0.05)"
                      >
                        {row.reference}
                      </Table.Cell>
                      <Table.Cell
                        fontFamily="body"
                        color="muted"
                        fontSize="xs"
                        px="4"
                        py="3"
                        borderColor="rgba(255,255,255,0.05)"
                      >
                        {row.date}
                      </Table.Cell>
                      <Table.Cell
                        px="4"
                        py="3"
                        borderColor="rgba(255,255,255,0.05)"
                      >
                        <Box
                          display="inline-flex"
                          px="2.5"
                          py="0.5"
                          rounded="full"
                          bg={
                            row.status === "paid"
                              ? "rgba(5,150,105,0.12)"
                              : "rgba(212,175,55,0.10)"
                          }
                          border="1px solid"
                          borderColor={
                            row.status === "paid"
                              ? "rgba(5,150,105,0.3)"
                              : "rgba(212,175,55,0.3)"
                          }
                        >
                          <Text
                            fontFamily="body"
                            fontSize="10px"
                            fontWeight="600"
                            color={row.status === "paid" ? "emerald" : "gold"}
                            textTransform="capitalize"
                          >
                            {row.status}
                          </Text>
                        </Box>
                      </Table.Cell>
                      <Table.Cell
                        fontFamily="heading"
                        fontWeight="700"
                        color="pearl"
                        fontSize="sm"
                        px="4"
                        py="3"
                        borderColor="rgba(255,255,255,0.05)"
                      >
                        {formatGBP(row.amount)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}
