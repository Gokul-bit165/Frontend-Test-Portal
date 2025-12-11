
import React, { useState } from 'react';
import axios from 'axios';

export default function AssetsTab({ assets, onLoadAssets }) {
    const [selectedAssets, setSelectedAssets] = useState(new Set());
    const [uploadingAsset, setUploadingAsset] = useState(false);
    const [assetSearch, setAssetSearch] = useState('');

    const toggleAssetSelection = (filename) => {
        const newSelected = new Set(selectedAssets);
        if (newSelected.has(filename)) {
            newSelected.delete(filename);
        } else {
            newSelected.add(filename);
        }
        setSelectedAssets(newSelected);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedAssets.size} assets?`)) return;

        let deletedCount = 0;
        for (const filename of selectedAssets) {
            try {
                await axios.delete(`/api/assets/${filename}`);
                deletedCount++;
            } catch (error) {
                console.error(`Failed to delete ${filename}:`, error);
            }
        }

        if (deletedCount > 0) {
            setSelectedAssets(new Set());
            await onLoadAssets();
        }
    };

    const handleUploadAsset = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingAsset(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('asset', file);
                formData.append('category', 'general');

                await axios.post('/api/assets/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            await onLoadAssets();
            alert('Asset(s) uploaded successfully!');
            e.target.value = '';
        } catch (error) {
            alert('Failed to upload asset: ' + error.message);
        } finally {
            setUploadingAsset(false);
        }
    };

    const handleDeleteAsset = async (filename) => {
        if (!confirm('Delete this asset? This cannot be undone.')) return;
        try {
            await axios.delete(`/api/assets/${filename}`);
            await onLoadAssets();
            // Also remove from selection if present
            if (selectedAssets.has(filename)) {
                const newSelected = new Set(selectedAssets);
                newSelected.delete(filename);
                setSelectedAssets(newSelected);
            }
            alert('Asset deleted successfully');
        } catch (error) {
            alert('Failed to delete asset: ' + error.message);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Path copied to clipboard!');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Asset Manager</h2>
                <div className="flex gap-2">
                    {selectedAssets.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        >
                            🗑️ Delete Selected ({selectedAssets.size})
                        </button>
                    )}
                    <label className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition">
                        {uploadingAsset ? 'Uploading...' : '📤 Upload Asset'}
                        <input
                            type="file"
                            multiple
                            onChange={handleUploadAsset}
                            disabled={uploadingAsset}
                            className="hidden"
                            accept="image/*,.html,.css,.js,.json"
                        />
                    </label>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search assets by filename..."
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                />
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {assets
                    .filter(asset =>
                        asset.filename.toLowerCase().includes(assetSearch.toLowerCase())
                    )
                    .map((asset, index) => (
                        <div
                            key={index}
                            onClick={() => toggleAssetSelection(asset.filename)}
                            className={`bg-white rounded-lg border overflow-hidden hover:shadow-sm transition-all group cursor-pointer relative ${selectedAssets.has(asset.filename) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                                }`}
                        >
                            {selectedAssets.has(asset.filename) && (
                                <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm">
                                    ✓
                                </div>
                            )}
                            {/* Preview */}
                            <div className="h-32 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                                {asset.type?.startsWith('image/') ? (
                                    <img
                                        src={asset.url}
                                        alt={asset.filename}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <div className="text-4xl mb-2">
                                            {asset.filename.endsWith('.html') ? '📄' :
                                                asset.filename.endsWith('.css') ? '🎨' :
                                                    asset.filename.endsWith('.js') ? '⚡' :
                                                        asset.filename.endsWith('.json') ? '📋' : '📁'}
                                        </div>
                                        <div className="text-sm">{asset.filename.split('.').pop().toUpperCase()}</div>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <h3 className="font-semibold truncate text-sm mb-1 text-gray-900" title={asset.filename}>{asset.filename}</h3>
                                <div className="text-[10px] text-gray-500 mb-2 space-y-0.5">
                                    <div>{(asset.size / 1024).toFixed(2)} KB • {new Date(asset.uploadedAt).toLocaleDateString()}</div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(asset.url);
                                        }}
                                        className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 border border-gray-200 transition-colors"
                                    >
                                        🔗 Copy URL
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAsset(asset.filename);
                                        }}
                                        className="px-2 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                        title="Delete Asset"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Empty State */}
            {assets.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                    <div className="text-4xl mb-3 opacity-30">📁</div>
                    <h3 className="text-lg font-semibold mb-1 text-gray-900">No Assets Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Upload images to get started</p>
                    <label className="inline-block px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black cursor-pointer transition-colors">
                        Upload Asset
                        <input
                            type="file"
                            multiple
                            onChange={handleUploadAsset}
                            disabled={uploadingAsset}
                            className="hidden"
                            accept="image/*,.html,.css,.js,.json"
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
