import html2canvas from 'html2canvas';
import { Jha } from '../../../models/permits/jha.model';

/**
 * Captures the JHA form data as a PNG image (base64).
 * Builds an off-screen HTML element styled like the paper JHA form,
 * renders it with html2canvas, then cleans up.
 */
export async function captureJhaAsImage(jha: Jha): Promise<string> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = buildJhaHtml(jha);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      width: 816,
      logging: false,
    });
    return canvas.toDataURL('image/png').split(',')[1];
  } finally {
    document.body.removeChild(container);
  }
}

export function buildJhaHtml(jha: Jha): string {
  const b = '1px solid #000';
  const cell = 'padding:4px 6px;border:' + b + ';';
  const hdrCell = 'font-weight:bold;padding:4px 6px;border:' + b + ';';
  const grayBg = 'background:#d0d0d0;';

  // Job info rows — single full-width cell per row, "Label: Value" inline (matches paper form)
  const jobInfoRows: [string, string][] = [
    ['PPE:', jha.ppe],
    ['LOTO:', jha.loto],
    ['Confined Space Entry:', jha.confinedSpace],
    ['Hazard Communication:', jha.hazCom],
    ['Hand and Power Tools:', jha.handAndPowerTools],
    ['Special Tools/Equipment:', jha.specialTools],
  ];

  const jobInfoHtml = jobInfoRows.map(([label, value]) =>
    `<tr><td style="${cell}"><span style="font-weight:bold;">${esc(label)}</span> ${esc(value)}</td></tr>`
  ).join('');

  // Job steps — 3 columns, number prefix in first column text
  let jobStepsHtml = '';
  if (jha.jobSteps && jha.jobSteps.length > 0) {
    const stepRows = jha.jobSteps.map((step, i) =>
      `<tr style="vertical-align:top;">
        <td style="${cell}">${i + 1} ${esc(step.description)}</td>
        <td style="${cell}">${esc(step.hazard)}</td>
        <td style="${cell}">${esc(step.safetyMeasures)}</td>
      </tr>`
    ).join('');

    jobStepsHtml = `
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:-1px;">
        <tr style="${grayBg}">
          <th style="${hdrCell}${grayBg}text-align:center;width:33%;">BASIC JOB STEP DESCRIPTION</th>
          <th style="${hdrCell}${grayBg}text-align:center;width:33%;">OBSERVED/POTWNTIAL HAZARDS</th>
          <th style="${hdrCell}${grayBg}text-align:center;width:34%;">SAFETY MEASURES NEEDED</th>
        </tr>
        ${stepRows}
      </table>`;
  }

  return `
    <div style="width:816px;min-height:1056px;box-sizing:border-box;padding:24px;font-family:Arial,sans-serif;font-size:12px;background:#fff;color:#000;">
      <!-- Header box -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="border:${b};padding:10px 16px;vertical-align:middle;width:40%;">
            <span style="font-size:28px;font-weight:bold;font-style:italic;">NAES</span>
          </td>
          <td style="border:${b};padding:10px 16px;text-align:right;vertical-align:middle;">
            <div style="font-size:18px;font-weight:bold;font-style:italic;">Job Hazard Analysis Form</div>
            <div style="font-size:12px;">Appendix A</div>
          </td>
        </tr>
      </table>

      <!-- Job Name -->
      <table style="width:100%;border-collapse:collapse;margin-top:-1px;">
        <tr>
          <td style="${cell}">
            <div style="font-size:10px;color:#444;">Job Name (or Brief Description):</div>
            <div style="font-size:13px;">${esc(jha.jobName)}</div>
          </td>
        </tr>
      </table>

      <!-- Applicability -->
      <table style="width:100%;border-collapse:collapse;margin-top:-1px;">
        <tr>
          <td style="${cell}">
            <span style="font-size:10px;color:#444;">Applicability:</span>
            <span style="font-size:12px;">${esc(jha.applicability)}</span>
          </td>
        </tr>
      </table>

      <!-- Analysis / Reviewed / Approved — header row then values row -->
      <table style="width:100%;border-collapse:collapse;margin-top:-1px;font-size:11px;">
        <tr>
          <td style="${hdrCell}">ANALISYS BY</td>
          <td style="${hdrCell}">DATE</td>
          <td style="${hdrCell}">REVIEWED BY</td>
          <td style="${hdrCell}">DATE</td>
          <td style="${hdrCell}">APPROVED BY</td>
          <td style="${hdrCell}">DATE</td>
        </tr>
        <tr>
          <td style="${cell}font-size:13px;">${esc(jha.analysisBy)}</td>
          <td style="${cell}">${esc(jha.date)}</td>
          <td style="${cell}font-size:13px;">${esc(jha.reviewedBy)}</td>
          <td style="${cell}">${esc(jha.date)}</td>
          <td style="${cell}font-size:13px;">${esc(jha.approvedBy)}</td>
          <td style="${cell}">${esc(jha.date)}</td>
        </tr>
      </table>

      <!-- Section header -->
      <div style="${grayBg}border:${b};margin-top:-1px;padding:4px 6px;text-align:center;font-weight:bold;font-size:11px;">
        CURRENT JOB INFORMATION - KNOWN PROCESSES AND REQUIREMENTS
      </div>

      <!-- Job info rows — single cell per row -->
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:-1px;">
        ${jobInfoHtml}
      </table>

      <!-- Job steps -->
      ${jobStepsHtml}

      <!-- Footer -->
      <div style="margin-top:12px;font-size:9px;color:#666;text-align:right;">
        Generated ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}
      </div>
    </div>
  `;
}

function esc(val: string | null | undefined): string {
  if (!val) return '';
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}
