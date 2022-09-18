import { useEffect, useRef } from "react";
import { VirtualAssistantType } from "./utils";
import { VirtualAssistant, VirtualAssistantOptions } from './virtual_assistant'

export function useVirtualAssistant(
  virtualAssistant: VirtualAssistantType,
  options?: VirtualAssistantOptions
) {
  const ref = useRef<VirtualAssistant>(new VirtualAssistant(virtualAssistant, options));

  useEffect(() => {
    ref.current.show()

    return () => {
      ref.current.removeFromDom()
    };
  }, [])

  return ref
}
