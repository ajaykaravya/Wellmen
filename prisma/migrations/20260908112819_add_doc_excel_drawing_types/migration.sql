-- AlterEnum
-- Widens ProjectDrawing.fileType to accept Word and Excel uploads.
-- Purely additive: every existing value stays valid, so no row is rewritten.
ALTER TABLE `ProjectDrawing`
    MODIFY `fileType` ENUM('PDF', 'PPT', 'DOC', 'EXCEL', 'IMAGE', 'AUTOCAD') NOT NULL;
