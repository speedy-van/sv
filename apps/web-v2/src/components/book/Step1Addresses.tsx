"use client";

import {
  Box,
  Checkbox,
  Field,
  HStack,
  Heading,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { AddressInput } from "./AddressInput";
import { ItemPicker } from "./ItemPicker";
import type { BookingAddress, PropertyDetails, SelectedItem } from "@/lib/booking-types";

interface AddressBlockProps {
  title: string;
  address: BookingAddress | null;
  setAddress: (a: BookingAddress | null) => void;
  details: PropertyDetails;
  setDetails: (d: PropertyDetails) => void;
}

const PROPERTY_TYPES: Array<{ value: PropertyDetails["type"]; label: string }> = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Flat / Apartment" },
  { value: "office", label: "Office" },
  { value: "storage", label: "Storage Unit" },
  { value: "other", label: "Other" },
];

const SIZES: Array<{ value: PropertyDetails["size"]; label: string }> = [
  { value: "studio", label: "Studio" },
  { value: "1bed", label: "1 Bedroom" },
  { value: "2bed", label: "2 Bedroom" },
  { value: "3bed", label: "3 Bedroom" },
  { value: "4bed", label: "4 Bedroom" },
  { value: "5bed_plus", label: "5+ Bedroom" },
];

function AddressBlock({ title, address, setAddress, details, setDetails }: AddressBlockProps) {
  return (
    <Stack gap="6">
      <Heading
        as="h3"
        fontFamily="heading"
        fontWeight="600"
        color="pearl"
        fontSize="lg"
        letterSpacing="-0.01em"
      >
        <Box as="span" color="gold" mr="2">—</Box>
        {title}
      </Heading>

      <AddressInput label="Address" value={address} onChange={setAddress} />

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
        <Field.Root>
          <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            Property Type
          </Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={details.type}
              onChange={(e) => setDetails({ ...details, type: e.target.value as PropertyDetails["type"] })}
              bg="rgba(255,255,255,0.06)"
              border="1px solid"
              borderColor="glassBorder"
              color="pearl"
              h="12"
              rounded="md"
              _focus={{ borderColor: "gold" }}
            >
              {PROPERTY_TYPES.map((p) => (
                <option key={p.value} value={p.value} style={{ background: "#09090B" }}>
                  {p.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator color="gold" />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            Property Size
          </Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={details.size}
              onChange={(e) => setDetails({ ...details, size: e.target.value as PropertyDetails["size"] })}
              bg="rgba(255,255,255,0.06)"
              border="1px solid"
              borderColor="glassBorder"
              color="pearl"
              h="12"
              rounded="md"
              _focus={{ borderColor: "gold" }}
            >
              {SIZES.map((s) => (
                <option key={s.value} value={s.value} style={{ background: "#09090B" }}>
                  {s.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator color="gold" />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            Floor (0 = ground)
          </Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={details.floors}
              onChange={(e) => setDetails({ ...details, floors: Number(e.target.value) })}
              bg="rgba(255,255,255,0.06)"
              border="1px solid"
              borderColor="glassBorder"
              color="pearl"
              h="12"
              rounded="md"
              _focus={{ borderColor: "gold" }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n} style={{ background: "#09090B" }}>
                  {n === 0 ? "Ground floor" : `Floor ${n}`}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator color="gold" />
          </NativeSelect.Root>
        </Field.Root>

        <Stack gap="3" justify="flex-end">
          <Checkbox.Root
            checked={details.hasLift}
            onCheckedChange={(e) => setDetails({ ...details, hasLift: !!e.checked })}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control bg="rgba(255,255,255,0.06)" borderColor="glassBorder" _checked={{ bg: "gold", borderColor: "gold" }}>
              <Checkbox.Indicator color="obsidian" />
            </Checkbox.Control>
            <Checkbox.Label color="pearl" fontFamily="body" fontSize="sm">
              Lift available
            </Checkbox.Label>
          </Checkbox.Root>
          <Checkbox.Root
            checked={details.hasParking}
            onCheckedChange={(e) => setDetails({ ...details, hasParking: !!e.checked })}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control bg="rgba(255,255,255,0.06)" borderColor="glassBorder" _checked={{ bg: "gold", borderColor: "gold" }}>
              <Checkbox.Indicator color="obsidian" />
            </Checkbox.Control>
            <Checkbox.Label color="pearl" fontFamily="body" fontSize="sm">
              Parking outside
            </Checkbox.Label>
          </Checkbox.Root>
        </Stack>
      </SimpleGrid>

      <Field.Root>
        <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
          Access notes (optional)
        </Field.Label>
        <Textarea
          value={details.accessNotes || ""}
          onChange={(e) => setDetails({ ...details, accessNotes: e.target.value })}
          placeholder="Buzzer code, narrow stairs, restricted hours…"
          bg="rgba(255,255,255,0.06)"
          border="1px solid"
          borderColor="glassBorder"
          color="pearl"
          rounded="md"
          rows={2}
          _placeholder={{ color: "rgba(250,250,249,0.35)" }}
          _focus={{ borderColor: "gold" }}
        />
      </Field.Root>
    </Stack>
  );
}

interface Step1Props {
  pickup: BookingAddress | null;
  setPickup: (a: BookingAddress | null) => void;
  pickupDetails: PropertyDetails;
  setPickupDetails: (d: PropertyDetails) => void;
  dropoff: BookingAddress | null;
  setDropoff: (a: BookingAddress | null) => void;
  dropoffDetails: PropertyDetails;
  setDropoffDetails: (d: PropertyDetails) => void;
  items: SelectedItem[];
  setItems: (items: SelectedItem[]) => void;
}

export function Step1Addresses(props: Step1Props) {
  return (
    <Stack gap={{ base: "10", md: "14" }}>
      <Stack gap="2">
        <Text color="gold" fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase">
          Step 2 of 4
        </Text>
        <Heading
          as="h2"
          fontFamily="heading"
          fontWeight="700"
          color="pearl"
          fontSize={{ base: "2xl", md: "3xl" }}
          letterSpacing="-0.02em"
        >
          Where are we going?
        </Heading>
        <Text fontFamily="body" color="muted" fontSize="sm">
          Two addresses, two property profiles, then your inventory.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: "10", lg: "12" }}>
        <AddressBlock
          title="Pickup"
          address={props.pickup}
          setAddress={props.setPickup}
          details={props.pickupDetails}
          setDetails={props.setPickupDetails}
        />
        <AddressBlock
          title="Drop-off"
          address={props.dropoff}
          setAddress={props.setDropoff}
          details={props.dropoffDetails}
          setDetails={props.setDropoffDetails}
        />
      </SimpleGrid>

      {/* Inventory */}
      <Stack gap="3">
        <Stack gap="1">
          <Text color="gold" fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase">
            Inventory
          </Text>
          <Heading
            as="h3"
            fontFamily="heading"
            fontWeight="600"
            color="pearl"
            fontSize="lg"
            letterSpacing="-0.01em"
          >
            What are we moving?
          </Heading>
          <Text fontFamily="body" color="muted" fontSize="sm">
            Add the bigger items so we send the right van and crew. You can refine later.
          </Text>
        </Stack>
        <ItemPicker items={props.items} onChange={props.setItems} />
      </Stack>
    </Stack>
  );
}
