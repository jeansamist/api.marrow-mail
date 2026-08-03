import geoip from 'geoip-lite'

export class GeoService {
  resolveCountryCode(ip: string): string | null {
    const result = geoip.lookup(ip)
    return result?.country ?? null
  }
}
