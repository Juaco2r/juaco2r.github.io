# juaco2r.github.io

Personal website and portfolio for digital pathology and medical image computing tools.

This site is hosted on **GitHub Pages** and showcases:
- Digital pathology utilities (TIFF/WSI handling, dataset downloaders, GUIs)
- Classical image processing pipelines (segmentation, feature extraction)
- Research context and future AI-ready roadmap

## Website
- Live site: https://juaco2r.github.io

## Structure
- `index.html` → Home
- `tools/` → Tools listing + tool pages
- `research/` → Research overview
- `about/` → Background and skills
- `contact/` → Contact links
- `assets/` → CSS / JS / images
- `downloads/` → PDFs (papers/posters) and other materials

## Featured tools (examples)
- **TiffCropper**: Crop high-resolution ROIs from large TIFF microscopy images while preserving calibration metadata.
- **HistRegGUI**: Desktop GUI for histology image registration using DeeperHistReg presets (CPU-only).
- **HPA Image Downloader**: Download IHC cancer images from Human Protein Atlas and generate structured folders + CSV metadata.
- **Cell Well Segmentation**: Classical CV pipeline for instance segmentation + feature extraction from multi-channel fluorescence TIFF images.

## Local development
You can edit the site using any editor (e.g., VS Code). To preview locally:
- Open `index.html` with a browser, or
- Use a simple local server:

### Python (optional)
```bash
python -m http.server 8000