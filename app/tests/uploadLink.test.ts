import { describe, it, expect, beforeEach } from 'vitest'
import { KeyType, loadConfig, SharedLink } from '@ipp/core'
import { uploadHealthcheck, uploadLink } from '../src/share'

/*
  Fork: visitor uploads are disabled. Whatever `ipp.uploadUrl` says, and even
  when the owner allowed uploads on the share, there is no "Add photos" link
  and no healthcheck probe route.
*/

function setConfig (config: unknown) {
  process.env.CONFIG = JSON.stringify(config)
  loadConfig()
}

const share = (overrides: Partial<SharedLink> = {}): SharedLink => ({
  key: 'the-key',
  keyType: KeyType.key,
  type: 'ALBUM',
  assets: [],
  expiresAt: null,
  allowUpload: true,
  ...overrides
})

describe('uploadLink (disabled in this fork)', () => {
  beforeEach(() => {
    delete process.env.CONFIG
    loadConfig()
  })

  it('is absent while ipp.uploadUrl is unset', () => {
    expect(uploadLink(share())).toBeUndefined()
    expect(uploadHealthcheck()).toBeUndefined()
  })

  it('is absent for a path on this hostname', () => {
    setConfig({ ipp: { uploadUrl: '/upload' } })
    expect(uploadLink(share())).toBeUndefined()
    expect(uploadHealthcheck()).toBeUndefined()
  })

  it('is absent for an absolute URL, by key or by slug', () => {
    setConfig({ ipp: { uploadUrl: 'https://upload.example.com' } })
    expect(uploadLink(share())).toBeUndefined()
    expect(uploadLink(share({ keyType: KeyType.slug, slug: 'holiday' }))).toBeUndefined()
    expect(uploadHealthcheck()).toBeUndefined()
  })
})
