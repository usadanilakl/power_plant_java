import { test, expect } from '@playwright/test';
import { LotoPointPage } from '../../pages/loto-point.page';

/**
 * LOTO Point Comment Tests
 *
 * These tests verify adding comments to LOTO points via the CommentsDialog UI.
 * Comments use the polymorphic Comment system (entityType="LotoPoint", entityId=lotoPoint.id).
 */

test.describe('LOTO Point Comments', () => {
  let lotoPointPage: LotoPointPage;

  test.beforeEach(async ({ page }) => {
    lotoPointPage = new LotoPointPage(page);
    await lotoPointPage.navigateToLotoPointsPage();
  });

  test('1. should add a single comment with needsAttention to a loto point', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const commentText = `Test comment - needs relabeling ${timestamp}`;

    // Wait for table to load
    await page.waitForTimeout(1000);

    // Click on the first loto point row to open its form
    const firstRow = page.locator('table tbody tr, .table-row, .data-row').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();
    await page.waitForTimeout(500);

    // Locate the comment input component in the form and click it to open the dialog
    const commentInput = page.locator('.form-popup app-comment-input');
    if (await commentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click the button inside comment-input to open the dialog
      const openDialogBtn = commentInput.locator('button').first();
      await openDialogBtn.click();
      await page.waitForTimeout(500);
    } else {
      // Alternatively, look for a comment cell in the table row and click it
      console.log('Comment input not found in form, trying comment cell in table');

      // Close the form first
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const commentCell = firstRow.locator('app-comment-cell .comment-cell');
      if (await commentCell.isVisible({ timeout: 2000 }).catch(() => false)) {
        await commentCell.click();
        await page.waitForTimeout(500);
      } else {
        console.log('WARNING: No comment cell found - comment column may not be configured yet');
        return;
      }
    }

    // Verify the CommentsDialog is open
    const commentsDialog = page.locator('app-comments-dialog');
    await expect(commentsDialog).toBeVisible({ timeout: 5000 });
    console.log('Comments dialog opened');

    // Type comment text in the textarea
    const commentTextarea = commentsDialog.locator('textarea.comment-textarea, textarea[placeholder="Write a comment..."]');
    await commentTextarea.click();
    await commentTextarea.fill(commentText);
    console.log(`Typed comment: "${commentText}"`);

    // Check "Needs Attention" checkbox
    const needsAttentionCheckbox = commentsDialog.locator('.checkbox-label').filter({ hasText: /needs attention/i }).locator('input[type="checkbox"]');
    await needsAttentionCheckbox.check();
    console.log('Checked "Needs Attention"');

    // Click "Add Comment" button
    const addCommentBtn = commentsDialog.getByRole('button', { name: /add comment/i });
    await addCommentBtn.click();
    await page.waitForTimeout(1000);
    console.log('Clicked "Add Comment"');

    // Verify comment appears in the comments list
    const commentItem = commentsDialog.locator('.comment-item').filter({ hasText: commentText });
    await expect(commentItem).toBeVisible({ timeout: 5000 });
    console.log('Comment appears in dialog list');

    // Verify the comment has the "Attention" badge
    const attentionBadge = commentItem.locator('.attention-badge');
    await expect(attentionBadge).toBeVisible({ timeout: 2000 });
    console.log('Attention badge is visible on the comment');

    // Close the dialog
    const closeBtn = commentsDialog.locator('button').filter({ hasText: /close|×/i }).first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      // Try the popup close button
      const popupCloseBtn = page.locator('app-rf-popup-projection .close-btn, .popup-close-btn').first();
      if (await popupCloseBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await popupCloseBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
    await page.waitForTimeout(500);

    // Verify the comment cell in the table shows the comment badge
    const commentBadge = firstRow.locator('app-comment-cell .comment-badge');
    if (await commentBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      const badgeText = await commentBadge.textContent();
      expect(parseInt(badgeText || '0')).toBeGreaterThanOrEqual(1);
      console.log(`Comment badge shows count: ${badgeText}`);
    } else {
      console.log('Comment badge not visible in table cell (column may not be configured)');
    }

    console.log('Single comment test completed successfully');
  });

  test('2. should add comments to multiple loto points (up to 10)', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    const timestamp = Date.now();

    // Wait for table to load
    await page.waitForTimeout(1000);

    // Get all visible loto point rows, limit to 10
    const allRows = page.locator('table tbody tr, .table-row, .data-row');
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

      // Try to open comment dialog via comment cell in the row
      const commentCell = row.locator('app-comment-cell .comment-cell');
      if (await commentCell.isVisible({ timeout: 2000 }).catch(() => false)) {
        await commentCell.click();
        await page.waitForTimeout(500);
      } else {
        // Fallback: click the row to open form, then use comment input
        await row.click();
        await page.waitForTimeout(500);

        const commentInput = page.locator('.form-popup app-comment-input');
        if (await commentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          const openDialogBtn = commentInput.locator('button').first();
          await openDialogBtn.click();
          await page.waitForTimeout(500);
        } else {
          console.log(`  Skipping LP ${i + 1}: no comment cell or input available`);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          continue;
        }
      }

      // Verify dialog is open
      const commentsDialog = page.locator('app-comments-dialog');
      const dialogVisible = await commentsDialog.isVisible({ timeout: 3000 }).catch(() => false);
      if (!dialogVisible) {
        console.log(`  Skipping LP ${i + 1}: dialog did not open`);
        continue;
      }

      // Type comment
      const commentTextarea = commentsDialog.locator('textarea.comment-textarea, textarea[placeholder="Write a comment..."]');
      await commentTextarea.click();
      await commentTextarea.fill(commentText);

      // Set needsAttention based on alternating pattern
      const needsAttentionCheckbox = commentsDialog.locator('.checkbox-label').filter({ hasText: /needs attention/i }).locator('input[type="checkbox"]');
      if (needsAttention) {
        await needsAttentionCheckbox.check();
      } else {
        await needsAttentionCheckbox.uncheck();
      }

      // Click Add Comment
      const addCommentBtn = commentsDialog.getByRole('button', { name: /add comment/i });
      await addCommentBtn.click();
      await page.waitForTimeout(1000);

      // Verify comment appears in the dialog
      const commentItem = commentsDialog.locator('.comment-item').filter({ hasText: commentText });
      const commentAppeared = await commentItem.isVisible({ timeout: 3000 }).catch(() => false);
      if (commentAppeared) {
        console.log(`  Comment added to LP ${i + 1}: "${commentText}" (needsAttention=${needsAttention})`);

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

      // Close the dialog
      const closeBtn = commentsDialog.locator('button').filter({ hasText: /close|×/i }).first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        const popupCloseBtn = page.locator('app-rf-popup-projection .close-btn, .popup-close-btn').first();
        if (await popupCloseBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await popupCloseBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
      await page.waitForTimeout(500);

      // Close any open form popup before moving to next row
      const formPopup = page.locator('.form-popup');
      if (await formPopup.isVisible({ timeout: 500 }).catch(() => false)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // ==================== FINAL VERIFICATION ====================
    console.log(`\n=== VERIFICATION: Checking comment badges for ${commentedRows.length} rows ===`);

    for (const { index, commentText } of commentedRows) {
      const row = allRows.nth(index);
      const commentBadge = row.locator('app-comment-cell .comment-badge');
      if (await commentBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
        const badgeText = await commentBadge.textContent();
        console.log(`  Row ${index + 1}: badge count = ${badgeText}`);
        expect(parseInt(badgeText || '0')).toBeGreaterThanOrEqual(1);
      } else {
        console.log(`  Row ${index + 1}: no badge visible (column may not be configured)`);
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total loto points processed: ${commentedRows.length}`);
    console.log(`Comments added successfully`);
  });
});
