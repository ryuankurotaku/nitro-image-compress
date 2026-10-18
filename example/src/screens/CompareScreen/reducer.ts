import type { CompareAction, CompareState } from './types';

export const compareReducer = (state: CompareState, action: CompareAction): CompareState => {
  switch (action.type) {
    case 'SET_SOURCE':
      return {
        ...state,
        source: action.payload,
        results: [],
        runCount: 0,
      };

    case 'START_BENCHMARK':
      return {
        ...state,
        loading: true,
        results: [],
      };

    case 'BENCHMARK_SUCCESS':
      return {
        ...state,
        loading: false,
        results: action.payload,
        runCount: state.runCount + 1,
      };

    case 'BENCHMARK_FAILURE':
      return {
        ...state,
        loading: false,
      };

    default:
      return state;
  }
};
