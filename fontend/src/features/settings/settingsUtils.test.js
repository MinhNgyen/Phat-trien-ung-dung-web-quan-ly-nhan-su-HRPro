import { describe, it, expect } from 'vitest';
import { PAYROLL_FIELDS, buildSettingsPayload, emptySettingsForm, formFromSettings } from './settingsUtils';

const full = { company: 'ACME', email: 'a@acme.vn', lunch: 730000, fuel: 300000, phoneAllow: 200000, ot: 1.5, bhxh: 8, bhyt: 1.5, bhtn: 1, personalRelief: 11000000, standardDays: 22, latePenalty: 50000 };

describe('settingsUtils', () => {
  it('formFromSettings -> chuỗi, thiếu field thì rỗng', () => {
    const f = formFromSettings(full);
    expect(f.lunch).toBe('730000');
    expect(f.ot).toBe('1.5');
    expect(formFromSettings({}).bhxh).toBe('');
  });
  it('buildSettingsPayload: ép về số, company rỗng -> null', () => {
    const { payload } = buildSettingsPayload({ ...formFromSettings(full), company: '  ' });
    expect(payload.company).toBeNull();
    expect(payload.bhxh).toBe(8);
    expect(Object.keys(payload)).toHaveLength(2 + PAYROLL_FIELDS.length);
  });
  it('thiếu hoặc sai giá trị số thì báo lỗi', () => {
    expect(buildSettingsPayload(emptySettingsForm()).error).toMatch(/giá trị số/);
    expect(buildSettingsPayload({ ...formFromSettings(full), ot: 'abc' }).error).toBeTruthy();
  });
});
