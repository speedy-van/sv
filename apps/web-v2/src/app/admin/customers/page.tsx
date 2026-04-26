"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Input,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { getCustomers, type AdminCustomer } from "@/lib/admin-api";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    (pg: number, q: string) => {
      setLoading(true);
      setError(null);
      getCustomers({ page: pg, search: q || undefined })
        .then((d) => {
          setCustomers(d.customers ?? []);
          setTotal(d.pagination?.total ?? 0);
          setPages(d.pagination?.pages ?? 1);
        })
        .catch(() => setError("Could not load customers."))
        .finally(() => setLoading(false));
    },
    [],
  );

  // Initial load
  useEffect(() => {
    load(1, "");
  }, [load]);

  // Debounced search
  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, val), 300);
  }

  function goPage(pg: number) {
    setPage(pg);
    load(pg, search);
  }

  return (
    <Stack gap="6">
      {/* Search + meta */}
      <HStack gap="3" flexWrap="wrap" justify="space-between">
        <Box position="relative" flex="1" maxW="360px">
          <Box
            as={HiOutlineMagnifyingGlass}
            position="absolute"
            left="3"
            top="50%"
            style={{ transform: "translateY(-50%)" }}
            fontSize="15px"
            color="var(--chakra-colors-muted)"
            pointerEvents="none"
          />
          <Input
            pl="9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name or email…"
            bg="rgba(255,255,255,0.03)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.1)"
            color="pearl"
            rounded="lg"
            _placeholder={{ color: "muted" }}
            _focus={{ borderColor: "gold", outline: "none" }}
            fontFamily="body"
            fontSize="sm"
            h="9"
          />
        </Box>
        {!loading && (
          <Text fontFamily="body" color="muted" fontSize="sm">
            {total.toLocaleString()} customer{total !== 1 ? "s" : ""}
          </Text>
        )}
      </HStack>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py="16">
          <Spinner color="gold" size="lg" borderWidth="3px" />
        </Box>
      ) : error ? (
        <Stack align="center" py="16" gap="4">
          <Text fontFamily="body" color="crimson" fontSize="sm">
            {error}
          </Text>
          <Button
            size="sm"
            variant="outline"
            borderColor="glassBorder"
            color="pearl"
            onClick={() => load(page, search)}
          >
            Retry
          </Button>
        </Stack>
      ) : customers.length === 0 ? (
        <Box
          bg="rgba(255,255,255,0.03)"
          border="1px solid"
          borderColor="rgba(255,255,255,0.07)"
          rounded="xl"
          p="12"
          textAlign="center"
        >
          <Text fontFamily="body" color="muted" fontSize="sm">
            No customers found.
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
                  {["Name", "Email", "Role", "Status", "Joined", "Last seen"].map((h) => (
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
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {customers.map((c) => (
                  <Table.Row
                    key={c.id}
                    borderColor="rgba(255,255,255,0.05)"
                    _hover={{ bg: "rgba(255,255,255,0.02)" }}
                  >
                    {/* Name */}
                    <Table.Cell px="4" py="3" borderColor="rgba(255,255,255,0.05)">
                      <HStack gap="2.5">
                        <Box
                          w="7"
                          h="7"
                          rounded="full"
                          bg="rgba(212,175,55,0.12)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Text fontFamily="heading" fontWeight="700" color="gold" fontSize="xs">
                            {(c.name?.[0] ?? "?").toUpperCase()}
                          </Text>
                        </Box>
                        <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                          {c.name}
                        </Text>
                      </HStack>
                    </Table.Cell>

                    {/* Email */}
                    <Table.Cell
                      fontFamily="body"
                      color="muted"
                      fontSize="xs"
                      px="4"
                      py="3"
                      borderColor="rgba(255,255,255,0.05)"
                    >
                      {c.email}
                    </Table.Cell>

                    {/* Role */}
                    <Table.Cell px="4" py="3" borderColor="rgba(255,255,255,0.05)">
                      <Box
                        display="inline-flex"
                        px="2.5"
                        py="0.5"
                        rounded="full"
                        bg="rgba(255,255,255,0.06)"
                        border="1px solid"
                        borderColor="rgba(255,255,255,0.1)"
                      >
                        <Text fontFamily="body" fontSize="10px" fontWeight="600" color="muted" textTransform="capitalize">
                          {c.role}
                        </Text>
                      </Box>
                    </Table.Cell>

                    {/* Status */}
                    <Table.Cell px="4" py="3" borderColor="rgba(255,255,255,0.05)">
                      <Box
                        display="inline-flex"
                        px="2.5"
                        py="0.5"
                        rounded="full"
                        bg={
                          c.isActive
                            ? "rgba(5,150,105,0.12)"
                            : "rgba(239,68,68,0.1)"
                        }
                        border="1px solid"
                        borderColor={
                          c.isActive
                            ? "rgba(5,150,105,0.3)"
                            : "rgba(239,68,68,0.25)"
                        }
                      >
                        <Text
                          fontFamily="body"
                          fontSize="10px"
                          fontWeight="600"
                          color={c.isActive ? "emerald" : "crimson"}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </Text>
                      </Box>
                    </Table.Cell>

                    {/* Joined */}
                    <Table.Cell
                      fontFamily="body"
                      color="muted"
                      fontSize="xs"
                      px="4"
                      py="3"
                      borderColor="rgba(255,255,255,0.05)"
                    >
                      {formatDate(c.createdAt)}
                    </Table.Cell>

                    {/* Last seen */}
                    <Table.Cell
                      fontFamily="body"
                      color="muted"
                      fontSize="xs"
                      px="4"
                      py="3"
                      borderColor="rgba(255,255,255,0.05)"
                    >
                      {formatDate(c.lastLogin)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <HStack justify="space-between" align="center" flexWrap="wrap" gap="2">
          <Text fontFamily="body" color="muted" fontSize="sm">
            Page {page} of {pages}
          </Text>
          <HStack gap="2">
            <Button
              size="sm"
              variant="outline"
              borderColor="glassBorder"
              color="muted"
              rounded="full"
              disabled={page <= 1}
              onClick={() => goPage(page - 1)}
              _hover={{ borderColor: "gold", color: "pearl" }}
            >
              ← Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              borderColor="glassBorder"
              color="muted"
              rounded="full"
              disabled={page >= pages}
              onClick={() => goPage(page + 1)}
              _hover={{ borderColor: "gold", color: "pearl" }}
            >
              Next →
            </Button>
          </HStack>
        </HStack>
      )}
    </Stack>
  );
}
