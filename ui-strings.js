/**
 * ui-strings.js — 阅读器界面语言包（唯一的界面文案来源）
 * ============================================================================
 *
 * 【给 AI 的说明 —— SETUP.md Step 5.5 会让你改这个文件】
 *
 * 本文件是阅读器**所有**面向用户文案的唯一存放处。`index.html` 与 `app.js` 里
 * 不得再出现硬编码的界面文字。
 *
 * Phase 0 采集到用户的**主要解释语言**之后，把下面每个值翻译成那个语言，并把
 * `lang` 改成对应的 BCP-47 代码。之后每次打开浏览器就都是用户的母语了。
 *
 * 改的时候必须遵守：
 *
 *   1. **只改冒号右边的值，绝不改左边的键名。** 键名是代码契约，
 *      `scripts/verify_reader.js` 会逐个核对；少一个键界面就会露出英文键名。
 *   2. **不要增删键。** 需要新文案时，`index.html` / `app.js` 和这里要一起改，
 *      并同步更新 `protocols/frontend_spec.md` §13 的键表。
 *   3. `welcomeBody` 的值里可以带 `<code>` 标签，会经 DOMPurify 消毒后插入；
 *      其余所有值一律当纯文本处理，写 HTML 不会生效。
 *   4. 图标字符（`○ ● ◌ ✓ ⚠ ☰ ☀ 🧭 ⬇ 🔍 📖 🗂 📝 ⟳ ↑ ↓ →`）保持原样，
 *      它们是状态语义的一部分（frontend_spec §6.3），不是可翻译文本。
 *   5. `saveStatusTitle` 里的 `⌘S / Ctrl+S` 是真实快捷键，不要改键名本身。
 *   6. 改完刷新浏览器验证一遍，并跑 `node scripts/verify_reader.js`。
 *
 * 换语言不需要动任何其它文件。
 */

window.UI_STRINGS = {
  // --- 文档级 --------------------------------------------------------------
  lang: 'vi',
  pageTitle: 'Trình đọc Bài học AI - Academic Writing',

  // --- 顶栏 ----------------------------------------------------------------
  sidebarToggleAria: 'Thu gọn / Mở rộng thanh bên',
  sidebarToggleTitle: 'Bật/tắt thanh bên trái',
  documentTitleEmpty: 'Chọn một bài học',
  themeAria: 'Chuyển đổi giao diện',
  themeTitle: 'Chuyển đổi giao diện Sáng/Tối',
  themeLabel: 'Light Mode',
  saveStatusTitle: 'Trạng thái lưu —— Nhấn để lưu ngay (⌘S / Ctrl+S)',
  saveStatusAria: 'Trạng thái lưu: Nhấn để lưu ngay',
  tocToggleAria: 'Bật/tắt mục lục bài học',
  tocToggleTitle: 'Bật/tắt mục lục bên phải',
  tocToggleLabel: 'Mục lục',
  exportLabel: 'Xuất file',

  // --- 侧栏 ----------------------------------------------------------------
  sidebarAria: 'Thanh bên đọc bài',
  tabContents: 'Mục lục',
  tabConcepts: 'Khái niệm',
  tabNotes: 'Ghi chú',
  searchPlaceholder: '🔍 Tìm tài liệu, khái niệm, ghi chú…',
  searchAria: 'Tìm kiếm thanh bên',
  panelLabel: 'Curriculum',
  refreshAria: 'Làm mới',
  refreshTitle: 'Làm mới danh sách',
  groupMagazines: 'Magazines',
  groupUnits: 'Units',
  conceptsHint: 'Lấy từ tiêu đề bài học hiện tại; nhấn để chuyển đến.',
  showAllNotesLabel: 'Hiển thị ghi chú của toàn bộ tài liệu',

  // --- 右侧章节目录 --------------------------------------------------------
  tocHeader: '🧭 Mục lục bài viết',

  // --- 欢迎页 --------------------------------------------------------------
  welcomeEyebrow: 'UNIVERSAL READER',
  welcomeTitle: 'Nội dung bài học sẽ xuất hiện tại đây',
  welcomeBody: 'Sau khi tạo bài học, tài liệu Markdown sẽ nằm trong thư mục <code>content/magazines</code> hoặc <code>content/units</code>.',

  // --- 注释弹窗 ------------------------------------------------------------
  noteDialogSelected: 'Đoạn văn bản đã chọn',
  noteDialogCloseAria: 'Đóng',
  noteDialogLabel: 'Ghi chú của bạn',
  noteDialogPlaceholder: 'Viết thắc mắc, giải thích hoặc +câu hỏi cho AI…',
  noteDialogDelete: 'Xóa',
  noteDialogCancel: 'Hủy',
  noteDialogSave: 'Lưu',
  addNoteLabel: '＋ Ghi chú',

  // --- 排序按钮（两个方向） ------------------------------------------------
  sortAsc: '↑ Cũ → Mới',
  sortDesc: '↓ Mới → Cũ',

  // --- 保存状态（状态机见 frontend_spec §6.3；顺序不可改） ------------------
  statusIdle: 'Sẵn sàng',
  statusDirty: 'Chưa lưu',
  statusSaving: 'Đang lưu…',
  statusSaved: 'Đã lưu',
  statusSaveFailed: 'Lưu thất bại',
  statusLoading: 'Đang tải…',
  statusLoaded: 'Đã tải xong',
  statusLoadFailed: 'Tải thất bại',
  statusInitFailed: 'Khởi tạo thất bại',

  // --- 空状态 --------------------------------------------------------------
  emptyGroup: 'Chưa có nội dung',
  contentsEmptyAria: 'Chưa có bài học nào',
  noDocumentOpen: 'Chưa mở tài liệu',
  conceptsNoHeadings: 'Tài liệu hiện tại không có tiêu đề phụ',
  tocNoHeadings: 'Tài liệu hiện tại không có tiêu đề',
  notesEmpty: 'Chưa có ghi chú nào',

  // --- 注释列表回退文案 ----------------------------------------------------
  noteSummaryFallback: 'Tóm tắt nội dung',
  noteHighlightOnly: 'Chỉ đánh dấu highlight',
  highlightTooltip: 'Đánh dấu',

  // --- Toast ---------------------------------------------------------------
  toastNoChanges: 'Không có thay đổi, nội dung đã mới nhất',
  toastNoteSaved: 'Đã lưu ghi chú',
  toastNoteDeleted: 'Đã xóa ghi chú',
  toastAnchorStale: 'Ghi chú này không còn khớp với nội dung bài viết — Mất neo liên kết.',

  // --- 图示 ----------------------------------------------------------------
  vizRenderFailed: 'Không thể hiển thị sơ đồ (nhấn để xem mã nguồn)',
};
