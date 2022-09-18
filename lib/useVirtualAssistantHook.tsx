import { useEffect, useRef } from "react";
import { VirtualAssistantType } from "./utils";
import {VirtualAssistant, VirtualAssistantOptions} from './virtual_assistant'

export function useVirtualAssistant(
  virtualAssistant: VirtualAssistantType,
  options?: VirtualAssistantOptions
) {
    const ref = useRef<VirtualAssistant>();

    useEffect(()=>{
        if (!ref.current) {
        ref.current = new VirtualAssistant(virtualAssistant, options);
        ref.current.show()
        }
        return () => {
            ref.current?.removeFromDom()
        };
    })

  return ref
}
