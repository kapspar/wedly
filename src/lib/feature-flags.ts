// Keep public map entry points and the map route under the same server-side flag.
export function publicVendorMapEnabled(value = process.env.PUBLIC_VENDOR_MAP_ENABLED) {
  return value === 'true'
}
