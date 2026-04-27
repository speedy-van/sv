"use client";

import { useEffect, useRef } from "react";
import type { Channel } from "pusher-js";
import { getPusher } from "@/lib/pusher-client";

export function usePusherChannel(channelName: string | null) {
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!channelName) return;
    const pusher = getPusher();
    if (!pusher) return;

    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    return () => {
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [channelName]);

  return channelRef;
}

export function usePusherEvent(
  channelName: string | null,
  eventName: string,
  callback: (data: unknown) => void
) {
  const channelRef = usePusherChannel(channelName);
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!channelName) return;
    const pusher = getPusher();
    if (!pusher) return;

    const channel = channelRef.current ?? pusher.subscribe(channelName);
    const handler = (data: unknown) => cbRef.current(data);
    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
    };
  }, [channelName, eventName, channelRef]);
}
