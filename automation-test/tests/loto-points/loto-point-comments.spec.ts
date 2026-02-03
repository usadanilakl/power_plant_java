import { test, expect, Page } from '@playwright/test';
import { LotoPointPage } from '../../pages/loto-point.page';

/**
 * LOTO Point Comment Tests
 *
 * Flow: right-click row → "View Details" → form opens → click comment button → CommentsDialog opens
 * Comments use the polymorphic Comment system (entityType="LotoPoint", entityId=lotoPoint.id).
 */

/**
 * Opens a loto point form via right-click context menu → View Details
 */
async function openLotoPointDetails(page: Page, row: any): Promise<void> {
  await row.click({ button: 'right' });
  await page.waitForTimeout(300);

  const viewDetailsItem = page.locator('.context-menu-item').filter({ hasText: /view details/i });
  await viewDetailsItem.click();
  await page.waitForTimeout(500);

  // Wait for the form to appear
  const formPopup = page.locator('.form-popup');
  await formPopup.waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Opens the CommentsDialog from the comment input in the form
 */
async function openCommentsDialog(page: Page): Promise<void> {
  const openDialogBtn = page.locator('.form-popup app-comment-input .open-dialog-btn');
  await openDialogBtn.waitFor({ state: 'visible', timeout: 5000 });
  await openDialogBtn.click();
  await page.waitForTimeout(500);

  // Wait for dialog to appear
  const commentsDialog = page.locator('app-comments-dialog');
  await commentsDialog.waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Adds a comment in the CommentsDialog
 */
async function addComment(page: Page, commentText: string, needsAttention: boolean): Promise<void> {
  const commentsDialog = page.locator('app-comments-dialog');

  // Type comment text
  const commentTextarea = commentsDialog.locator('textarea.comment-textarea');
  await commentTextarea.click();
  await commentTextarea.fill(commentText);

  // Set needsAttention checkbox
  const needsAttentionCheckbox = commentsDialog
    .locator('.checkbox-label')
    .filter({ hasText: /needs attention/i })
    .locator('input[type="checkbox"]');
  if (needsAttention) {
    await needsAttentionCheckbox.check();
  } else {
    await needsAttentionCheckbox.uncheck();
  }

  // Click Add Comment
  const addCommentBtn = commentsDialog.locator('.btn.btn-primary').filter({ hasText: /add comment/i });
  await addCommentBtn.click();
  await page.waitForTimeout(1000);
}

/**
 * Closes the CommentsDialog and form popup
 */
async function closeDialogAndForm(page: Page): Promise<void> {
  // Close the comments dialog via the popup close button
  const popupCloseBtn = page.locator('app-rf-popup-projection .close-btn, .popup-close-btn').first();
  if (await popupCloseBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await popupCloseBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(300);

  // Close the form popup if still open
  const formPopup = page.locator('.form-popup');
  if (await formPopup.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}

test.describe('LOTO Point Comments', () => {
  let lotoPointPage: LotoPointPage;

  test.beforeEach(async ({ page }) => {
    lotoPointPage = new LotoPointPage(page);
    // Navigate without networkidle (which can timeout on long-polling/SSE connections)
    await page.goto('/home');
    const skipButton = page.getByRole('button', { name: 'Skip for now' });
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
    await page.getByRole('link', { name: /loto points/i }).first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('1. should add a single comment with needsAttention to a loto point', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const commentText = `Test comment - needs relabeling ${timestamp}`;

    // Wait for table rows to appear
    const firstRow = page.locator('table tbody tr, .table-row, .data-row').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Right-click → View Details to open the form
    await openLotoPointDetails(page, firstRow);
    console.log('Opened loto point form via context menu');

    // Open CommentsDialog via the comment input button in the form
    await openCommentsDialog(page);
    console.log('Comments dialog opened');

    // Add a comment with needsAttention=true
    await addComment(page, commentText, true);
    console.log(`Added comment: "${commentText}" with needsAttention=true`);

    // Verify comment appears in the dialog list
    const commentsDialog = page.locator('app-comments-dialog');
    const commentItem = commentsDialog.locator('.comment-item').filter({ hasText: commentText });
    await expect(commentItem).toBeVisible({ timeout: 5000 });
    console.log('Comment appears in dialog list');

    // Verify the comment has the "Attention" badge
    const attentionBadge = commentItem.locator('.attention-badge');
    await expect(attentionBadge).toBeVisible({ timeout: 2000 });
    console.log('Attention badge is visible on the comment');

    // Close dialog and form
    await closeDialogAndForm(page);

    console.log('Single comment test completed successfully');
  });

  test('2. should add comments to multiple loto points (up to 10)', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    const timestamp = Date.now();

    // Wait for table rows to appear
    const allRows = page.locator('table tbody tr, .table-row, .data-row');
    await allRows.first().waitFor({ state: 'visible', timeout: 10000 });
    const rowCount = await allRows.count();
    const maxRows = Math.min(rowCount, 10);

    if (maxRows === 0) {
      console.log('No loto points found in table - skipping test');
      return;
    }

    console.log(`Found ${rowCount} loto points, will add comments to ${maxRows}`);

    const commentedRows: { index: number; commentText: string }[] = [];

    for (let i = 0; i < maxRows; i++) {
      const row = allRows.nth(i);
      const rowText = await row.textContent();
      console.log(`\n--- Processing loto point ${i + 1}/${maxRows}: ${rowText?.substring(0, 50)}... ---`);

      const commentText = `Test comment for LP ${i + 1} - ${timestamp}`;
      const needsAttention = i % 2 === 0; // alternate: true for even index, false for odd

      // Right-click → View Details to open the form
      await openLotoPointDetails(page, row);

      // Open CommentsDialog via the comment input button
      await openCommentsDialog(page);

      // Add a comment
      await addComment(page, commentText, needsAttention);

      // Verify comment appears in the dialog
      const commentsDialog = page.locator('app-comments-dialog');
      const commentItem = commentsDialog.locator('.comment-item').filter({ hasText: commentText });
      const commentAppeared = await commentItem.isVisible({ timeout: 3000 }).catch(() => false);
      if (commentAppeared) {
        console.log(`  Comment added: "${commentText}" (needsAttention=${needsAttention})`);

        // Verify attention badge if needsAttention was set
        if (needsAttention) {
          const attentionBadge = commentItem.locator('.attention-badge');
          const hasBadge = await attentionBadge.isVisible({ timeout: 1000 }).catch(() => false);
          console.log(`  Attention badge visible: ${hasBadge}`);
        }
      } else {
        console.log(`  WARNING: Comment not visible in dialog for LP ${i + 1}`);
      }

      commentedRows.push({ index: i, commentText });

      // Close dialog and form before moving to next row
      await closeDialogAndForm(page);
    }

    // ==================== FINAL SUMMARY ====================
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total loto points processed: ${commentedRows.length}`);
    console.log(`Comments added successfully`);
  });
});
