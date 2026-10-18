import type { NitroAction, NitroState } from './types';

export const nitroReducer = (state: NitroState, action: NitroAction): NitroState => {
  switch (action.type) {
    case 'SET_SOURCE':
      return {
        ...state,
        sourceUri: action.payload.uri,
        sourceInfo: action.payload.info,
        result: null,
        duration: null,
        runCount: 0,
      };

    case 'START_COMPRESS':
      return {
        ...state,
        loading: true,
      };

    case 'COMPRESS_SUCCESS':
      return {
        ...state,
        loading: false,
        result: action.payload.result,
        duration: action.payload.duration,
        runCount: state.runCount + 1,
      };

    case 'COMPRESS_FAILURE':
      return {
        ...state,
        loading: false,
      };

    default:
      return state;
  }
};
