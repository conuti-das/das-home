# Known Issues & Workarounds

## Frontend

### Card Drag-and-Drop Resize
- **Status**: Not implemented
- **Detail**: Visual hooks are in place but actual resize via drag is not functional
- **Workaround**: Size can be set via card edit popup / wizard

### useEntitiesByArea Device-Area Mapping
- **Status**: TODO
- **Detail**: Hook needs proper device→area mapping from HA API
- **Workaround**: Currently relies on entity area_id directly

### Undo/Redo Not Persisted
- **Status**: By design (in-memory only)
- **Detail**: Undo/redo history is lost on page reload
- **Impact**: Low - dashboard config itself is persisted

## Backend

### FastAPI Version Pinning
- **Status**: Resolved
- **Detail**: FastAPI `0.115.6` had import issues with `pydantic-core 2.27.2`
- **Fix**: Pinned to `>=0.115.6,<1.0.0` in requirements.txt

## Architecture

### Single-User Design
- **Status**: Known limitation
- **Detail**: No multi-user auth, no concurrent edit protection
- **Impact**: Fine for home use, not suitable for shared environments

## Build

### Pydantic Config Style
- **Rule**: Always use `model_config = ConfigDict(...)`, never deprecated `class Config`
- **Reason**: Pydantic v2 deprecation warnings, future compatibility

### Dockerfile Paths
- **WORKDIR**: `/app`
- **Copy**: `backend/app` → `/app/app/`
- **Static files**: Path calculated relative to `main.py` location
