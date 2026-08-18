import geoip from 'geoip-lite'

export class GeoService {
  resolveCountryCode(ip: string): string {
    const result = geoip.lookup(ip)
    return result?.country ?? 'CM'
  }
}
