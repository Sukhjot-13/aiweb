'use client';

import { useState } from 'react';

export default function TestPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process query');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    'Find the best price for iPhone 14',
    'Give me a list of prices for Samsung Galaxy S23',
    'What is the cheapest MacBook Air available?',
    'Compare prices for AirPods Pro across stores',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              🤖 AI Automation Test
            </h1>
            <p className="text-gray-300 text-lg">
              Ask anything about product prices and let AI automation find the answer
            </p>
          </div>

          {/* Main Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="query" className="block text-sm font-medium text-gray-200 mb-2">
                    Your Query
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Find the best price for iPhone 14"
                      className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg"
                      disabled={loading}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Run AI Automation'
                  )}
                </button>
              </form>

              {/* Example Queries */}
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-3">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {exampleQueries.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(example)}
                      disabled={loading}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-red-400">Error</h3>
                      <p className="text-red-300 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Display */}
              {result && (
                <div className="mt-6 space-y-4">
                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${result.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-gray-300 font-medium capitalize">{result.status}</span>
                  </div>

                  {/* Task Info */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold mb-2">📋 Task Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Goal:</span>
                        <span className="text-gray-200">{result.task?.goal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Steps:</span>
                        <span className="text-gray-200">{result.task?.steps?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-gray-200">{result.executionTime}ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Error Details */}
                  {result.error && (
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <h3 className="text-red-300 font-semibold mb-2">❌ Error Details</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">Message:</span>
                          <p className="text-red-300 mt-1">
                            {typeof result.error.message === 'string' 
                              ? result.error.message 
                              : JSON.stringify(result.error.message)}
                          </p>
                        </div>
                        {result.error.details && (
                          <div>
                            <span className="text-gray-400">Details:</span>
                            <p className="text-red-300 mt-1 font-mono text-xs break-all">
                              {typeof result.error.details === 'string'
                                ? result.error.details
                                : JSON.stringify(result.error.details)}
                            </p>
                          </div>
                        )}
                        {result.error.failedStep && (
                          <div>
                            <span className="text-gray-400">Failed Step:</span>
                            <p className="text-red-300 mt-1">
                              {typeof result.error.failedStep === 'string'
                                ? result.error.failedStep
                                : result.error.failedStep.description || JSON.stringify(result.error.failedStep)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Result Data */}
                  {result.aiProvider && (
                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <h3 className="text-purple-300 font-semibold mb-2">🤖 AI Provider</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-gray-200 capitalize">{result.aiProvider.type}</span>
                        </div>
                        {result.aiProvider.model && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Model:</span>
                            <span className="text-gray-200">{result.aiProvider.model}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Steps Executed */}
                  {result.steps && result.steps.length > 0 && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold mb-3">⚡ Steps Executed</h3>
                      <div className="space-y-2">
                        {result.steps.map((step, index) => (
                          <div key={index} className="flex items-start space-x-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-300 font-semibold">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-200">{step.description}</p>
                              {step.status && (
                                <span className={`text-xs ${step.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                                  {step.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Result Data */}
                  {result.result && (
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <h3 className="text-green-300 font-semibold mb-2">✅ Results</h3>
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Events */}
                  {result.events && result.events.length > 0 && (
                    <details className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <summary className="text-white font-semibold cursor-pointer">
                        📡 Events ({result.events.length})
                      </summary>
                      <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
                        {result.events.map((event, index) => (
                          <div key={index} className="text-xs text-gray-400 font-mono">
                            <span className="text-purple-400">[{new Date(event.timestamp).toLocaleTimeString()}]</span>{' '}
                            <span className="text-gray-300">{event.type}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Footer */}
          <div className="max-w-4xl mx-auto mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Powered by <span className="text-purple-400 font-semibold">AI Web Automation Platform</span>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Phase 2: Task Orchestration Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
