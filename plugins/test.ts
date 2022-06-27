// import '../static/wasm_exec'
import Vue from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    $wasm: {
      add: WebAssembly.ExportValue
      multiply: WebAssembly.ExportValue
    }
  }
}

const wasmBrowserInstantiate = async (
  wasmModuleUrl: RequestInfo,
  importObject: WebAssembly.Imports
) => {
  let response

  // Check if the browser supports streaming instantiation
  if (WebAssembly.instantiateStreaming) {
    // Fetch the module, and instantiate it as it is downloading
    response = await WebAssembly.instantiateStreaming(
      fetch(wasmModuleUrl),
      importObject
    )
  } else {
    // Fallback to using fetch to download the entire module
    // And then instantiate the module
    const fetchAndInstantiateTask = async () => {
      const wasmArrayBuffer = await fetch(wasmModuleUrl).then((response) =>
        response.arrayBuffer()
      )
      return WebAssembly.instantiate(wasmArrayBuffer, importObject)
    }

    response = await fetchAndInstantiateTask()
  }

  return response
}

const go = new window.Go()

const exports = async () => {
  // Get the importObject from the go instance.
  const importObject = go.importObject

  // Instantiate our wasm module
  const wasmModule = await wasmBrowserInstantiate('./main.wasm', importObject)
  // Allow the wasm_exec go instance, bootstrap and execute our wasm module
  go.run(wasmModule.instance)
  const { add, multiply } = wasmModule.instance.exports
  return { add, multiply }
}

const main = async () => {
  const { add, multiply } = await exports()
  Vue.prototype.$wasm = {
    add,
    multiply,
  }
}

main()
