import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { documentAPI } from '../../services/api';

export const fetchHistory = createAsyncThunk(
  'documents/fetchHistory',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await documentAPI.getHistory(params);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch history');
    }
  }
);

export const fetchDocument = createAsyncThunk(
  'documents/fetchDocument',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await documentAPI.getDocument(id);
      return data.data.document;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch document');
    }
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState: {
    documents: [],
    currentDocument: null,
    pagination: null,
    loading: false,
    error: null,
    uploadProgress: 0,
    processingStage: '',
  },
  reducers: {
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    setProcessingStage: (state, action) => {
      state.processingStage = action.payload;
    },
    setCurrentDocument: (state, action) => {
      state.currentDocument = action.payload;
    },
    clearCurrentDocument: (state) => {
      state.currentDocument = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => { state.loading = true; })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.documents;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDocument.pending, (state) => { state.loading = true; })
      .addCase(fetchDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDocument = action.payload;
      })
      .addCase(fetchDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUploadProgress, setProcessingStage, setCurrentDocument, clearCurrentDocument } =
  documentSlice.actions;
export default documentSlice.reducer;
