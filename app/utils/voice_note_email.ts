// A voice note is never attached raw — it's rendered as a play button that
// links out to a public playback page. Table-based markup and inline styles
// only, since this has to survive Outlook's Word rendering engine.
export function buildVoiceNoteEmailBlock(playbackUrl: string): string {
  const bars = [10, 16, 22, 14, 20, 12, 18]
    .map(
      (height) =>
        `<td style="width:3px;height:${height}px;background:#ffffff;opacity:.85;font-size:0;line-height:0;">&nbsp;</td><td style="width:3px;font-size:0;line-height:0;">&nbsp;</td>`
    )
    .join('')

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td>
          <a href="${playbackUrl}" style="display:inline-block;text-decoration:none;background:#111827;border-radius:24px;padding:10px 18px 10px 10px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:32px;height:32px;background:#ffffff;border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;line-height:32px;color:#111827;font-family:sans-serif;">&#9658;</td>
                <td style="width:12px;font-size:0;line-height:0;">&nbsp;</td>
                <td>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${bars}</tr></table>
                </td>
                <td style="width:12px;font-size:0;line-height:0;">&nbsp;</td>
                <td style="color:#ffffff;font-family:sans-serif;font-size:13px;vertical-align:middle;white-space:nowrap;">Voice message</td>
              </tr>
            </table>
          </a>
        </td>
      </tr>
    </table>
  `.trim()
}
