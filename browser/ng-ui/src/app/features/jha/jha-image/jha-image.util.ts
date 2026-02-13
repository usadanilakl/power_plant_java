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

function buildJhaHtml(jha: Jha): string {
  const fields = [
    ['Job Name / Title', jha.jobName],
    ['Applicability', jha.applicability],
    ['Analysis By', jha.analysisBy],
    ['Reviewed By', jha.reviewedBy],
    ['Approved By', jha.approvedBy],
    ['Date', jha.date],
    ['PPE', jha.ppe],
    ['LOTO', jha.loto],
    ['Confined Space', jha.confinedSpace],
    ['HazCom', jha.hazCom],
    ['Hand & Power Tools', jha.handAndPowerTools],
    ['Special Tools', jha.specialTools],
  ];

  const fieldRows = fields.map(([label, value]) =>
    `<tr>
      <td style="font-weight:bold;width:200px;padding:4px 8px;border:1px solid #000;">${esc(label)}</td>
      <td style="padding:4px 8px;border:1px solid #000;">${esc(value)}</td>
    </tr>`
  ).join('');

  let jobStepsHtml = '';
  if (jha.jobSteps && jha.jobSteps.length > 0) {
    const stepRows = jha.jobSteps.map((step, i) =>
      `<tr>
        <td style="text-align:center;padding:4px 8px;border:1px solid #000;">${i + 1}</td>
        <td style="padding:4px 8px;border:1px solid #000;">${esc(step.description)}</td>
        <td style="padding:4px 8px;border:1px solid #000;">${esc(step.hazard)}</td>
        <td style="padding:4px 8px;border:1px solid #000;">${esc(step.safetyMeasures)}</td>
      </tr>`
    ).join('');

    jobStepsHtml = `
      <h3 style="margin:12px 0 4px 0;font-size:14px;">Job Steps</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#e0e0e0;">
          <th style="width:40px;padding:4px 8px;border:1px solid #000;">#</th>
          <th style="padding:4px 8px;border:1px solid #000;">Description</th>
          <th style="padding:4px 8px;border:1px solid #000;">Hazard</th>
          <th style="padding:4px 8px;border:1px solid #000;">Safety Measures</th>
        </tr>
        ${stepRows}
      </table>
    `;
  }

  return `
    <div style="width:816px;padding:24px;font-family:Arial,sans-serif;font-size:12px;background:#fff;color:#000;">
      <h2 style="text-align:center;margin:0 0 16px 0;font-size:18px;border-bottom:2px solid #000;padding-bottom:8px;">
        JOB HAZARD ANALYSIS (JHA)
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        ${fieldRows}
      </table>
      ${jobStepsHtml}
      <div style="margin-top:16px;font-size:10px;color:#666;text-align:right;">
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
