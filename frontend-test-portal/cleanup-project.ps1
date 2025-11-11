# 🧹 Automated Project Cleanup Script
# Removes unnecessary documentation and script files

Write-Host "🧹 Frontend Test Portal - Project Cleanup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot

# Files to remove
$filesToRemove = @(
    # Redundant Documentation
    "ADMIN_DASHBOARD_GUIDE.md",
    "ADMIN_DASHBOARD_TECHNICAL.md",
    "ADMIN_DELETE_FEATURE.md",
    "ADMIN_SCREENSHOT_FEATURE.md",
    "BROWSER_CACHE_FIX.md",
    "BROWSER_CACHE_PROOF.md",
    "CACHE_BYPASS_COMPLETE_GUIDE.md",
    "CHALLENGES_TAB_REMOVED_COMPLETE.md",
    "CHALLENGE_VIEW_FIX.md",
    "CHECKLIST.md",
    "COMPLETE.md",
    "COMPLETE_IMPLEMENTATION.md",
    "COMPLETE_SYSTEM_SUMMARY.md",
    "CONSOLE_ERRORS_FIXED.md",
    "DEPLOYMENT_COMPLETE.md",
    "EVALUATION_COMPARISON.md",
    "EVALUATION_SPEED_FIX.md",
    "FEATURES_READY.md",
    "FINAL_FIX_SUMMARY.md",
    "FRESH_BUILD_COMPLETE.md",
    "IMPLEMENTATION_COMPLETE.md",
    "IMPLEMENTATION_SUMMARY.md",
    "JSON_FALLBACK_FIX.md",
    "MYSQL_DATA_MIGRATED.md",
    "MYSQL_INTEGRATION_COMPLETE.md",
    "MYSQL_INTEGRATION_SUCCESS.md",
    "MYSQL_REALTIME_SETUP.md",
    "MYSQL_SETUP_QUICK_GUIDE.md",
    "NEW_FEATURES_SUMMARY.md",
    "QUICK_FIX_SUMMARY.md",
    "RESTRICTIONS_FIX_SUMMARY.md",
    "SEMANTIC_EVAL_COMPLETE.md",
    "SHOW_EXPECTED_RESULT_FEATURE.md",
    "SKIP_MYSQL_FOR_NOW.md",
    "SPEED_COMPARISON.md",
    "STRICT_CONTENT_EVALUATION.md",
    "SUBMISSION_DETAILS_GUIDE.md",
    "TESTING_CHECKLIST.md",
    "TIMER_AND_RESTRICTIONS_COMPLETE.md",
    "UPDATE_SUMMARY.md",
    "CHANGELOG.md",
    
    # Utility Scripts
    "clear-browser-cache.ps1",
    "debug-restrictions.ps1",
    "docker-logs.ps1",
    "docker-rebuild.ps1",
    "FORCE-CLEAR-CACHE.ps1",
    "FORCE-NEW-UI.ps1",
    "MANAGE-QUESTIONS-ADDED.ps1",
    "restart-backend.ps1",
    "show-new-ui.ps1",
    "start-backend-direct.ps1",
    "start-backend.bat",
    "VERIFY-CHANGES.ps1",
    "import-data-to-mysql.ps1",
    
    # Test/Template Files
    "courses-response.json",
    "template-test.json",
    "test-restrictions.html",
    
    # Duplicate Config
    "docker-compose-mysql.yml",
    "setup-mysql.bat"
)

$foldersToRemove = @(
    "test-questions"
)

# Confirm before deletion
Write-Host "# ⚠️  This will remove $($filesToRemove.Count) files and $($foldersToRemove.Count) folders" -ForegroundColor Yellow
Write-Host ""
Write-Host "Files to be removed:" -ForegroundColor Yellow
foreach ($file in $filesToRemove | Sort-Object) {
    Write-Host "  - $file" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Folders to be removed:" -ForegroundColor Yellow
foreach ($folder in $foldersToRemove) {
    Write-Host "  - $folder/" -ForegroundColor Gray
}
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🗑️  Removing files..." -ForegroundColor Cyan

$removedCount = 0
$notFoundCount = 0

# Remove files
foreach ($file in $filesToRemove) {
    $filePath = Join-Path $rootPath $file
    if (Test-Path $filePath) {
        try {
            Remove-Item $filePath -Force
            Write-Host "  ✓ Removed: $file" -ForegroundColor Green
            $removedCount++
        } catch {
            Write-Host "  ✗ Failed to remove: $file - $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⊘ Not found: $file" -ForegroundColor DarkGray
        $notFoundCount++
    }
}

# Remove folders
foreach ($folder in $foldersToRemove) {
    $folderPath = Join-Path $rootPath $folder
    if (Test-Path $folderPath) {
        try {
            Remove-Item $folderPath -Recurse -Force
            Write-Host "  ✓ Removed folder: $folder/" -ForegroundColor Green
            $removedCount++
        } catch {
            Write-Host "  ✗ Failed to remove folder: $folder/ - $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⊘ Not found: $folder/" -ForegroundColor DarkGray
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
Write-Host "  - Removed: $removedCount items" -ForegroundColor Green
Write-Host "  - Not found: $notFoundCount items" -ForegroundColor Gray
Write-Host ""
Write-Host "📁 Remaining essential files:" -ForegroundColor Cyan
Write-Host "  ✓ README.md" -ForegroundColor Green
Write-Host "  ✓ QUICKSTART.md" -ForegroundColor Green
Write-Host "  ✓ INDEX.md" -ForegroundColor Green
Write-Host "  ✓ ARCHITECTURE.md" -ForegroundColor Green
Write-Host "  ✓ PROJECT_SUMMARY.md" -ForegroundColor Green
Write-Host "  ✓ TROUBLESHOOTING.md" -ForegroundColor Green
Write-Host "  ✓ setup.ps1" -ForegroundColor Green
Write-Host "  ✓ setup-mysql.ps1" -ForegroundColor Green
Write-Host "  ✓ docker-compose.yml" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your project is now cleaner and more organized!" -ForegroundColor Cyan
