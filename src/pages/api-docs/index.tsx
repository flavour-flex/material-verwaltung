import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  category: 'Email' | 'Bestellungen' | 'Artikel' | 'Standorte' | 'Service';
  requestBody?: string;
  responseBody?: string;
  example?: string;
}

const apiEndpoints: ApiEndpoint[] = [
  // Email APIs
  {
    path: '/api/email/send-bestellung',
    method: 'POST',
    category: 'Email',
    description: 'Sendet eine Email-Benachrichtigung für eine neue Bestellung an das Hauptlager',
    requestBody: `{
  "email": "string",
  "bestellung": {
    "standort": { "name": "string" },
    "artikel": [{ "artikel": { "name": "string" }, "menge": "number" }]
  }
}`
  },
  {
    path: '/api/email/send-versand',
    method: 'POST',
    category: 'Email',
    description: 'Benachrichtigt Standort-Verantwortliche über versendete Bestellung',
    requestBody: `{
  "bestellung": {
    "id": "string",
    "standort": {
      "name": "string",
      "verantwortliche": [{ "name": "string", "email": "string" }]
    },
    "artikel": [{ "artikel": { "name": "string" }, "versandte_menge": "number" }]
  }
}`
  },
  // Bestellungen APIs
  {
    path: '/api/bestellungen',
    method: 'GET',
    category: 'Bestellungen',
    description: 'Lädt alle Bestellungen mit Filteroptionen',
    responseBody: `[{
  "id": "string",
  "status": "offen" | "versendet" | "teilweise_versendet" | "storniert",
  "standort": { "name": "string" },
  "artikel": [{ "name": "string", "menge": "number" }]
}]`
  },
  {
    path: '/api/bestellungen/[id]',
    method: 'GET',
    category: 'Bestellungen',
    description: 'Lädt Details einer spezifischen Bestellung',
    responseBody: `{
  "id": "string",
  "status": "string",
  "standort": { "name": "string", "adresse": "string" },
  "artikel": [{ "name": "string", "menge": "number" }],
  "ersteller": { "email": "string", "name": "string" }
}`
  },
  {
    path: '/api/bestellungen',
    method: 'POST',
    category: 'Bestellungen',
    description: 'Erstellt eine neue Bestellung',
    requestBody: `{
  "standort_id": "string",
  "artikel": [{ "artikel_id": "string", "menge": "number" }]
}`
  },
  // Artikel APIs
  {
    path: '/api/artikel',
    method: 'GET',
    category: 'Artikel',
    description: 'Lädt alle verfügbaren Artikel',
    responseBody: `[{
  "id": "string",
  "name": "string",
  "artikelnummer": "string",
  "kategorie": "string",
  "bestand": "number"
}]`
  }
];

export default function ApiDocsPage() {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});

  const categories = Array.from(new Set(apiEndpoints.map(e => e.category)));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleEndpoint = (path: string) => {
    setExpandedEndpoints(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">API Dokumentation</h1>
            <p className="mt-2 text-sm text-gray-700">
              Übersicht aller verfügbaren API-Endpunkte der Materialverwaltung.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {categories.map(category => (
            <div key={category} className="bg-white shadow rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
              >
                <h2 className="text-lg font-medium text-gray-900">{category}</h2>
                {expandedCategories[category] ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {expandedCategories[category] && (
                <div className="divide-y divide-gray-200">
                  {apiEndpoints
                    .filter(endpoint => endpoint.category === category)
                    .map(endpoint => (
                      <div key={endpoint.path} className="px-4 py-4">
                        <button
                          onClick={() => toggleEndpoint(endpoint.path)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium
                              ${endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                                endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'}`}>
                              {endpoint.method}
                            </span>
                            <code className="text-sm font-mono text-gray-900">{endpoint.path}</code>
                            {expandedEndpoints[endpoint.path] ? (
                              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </button>
                        
                        <p className="mt-2 text-sm text-gray-500">{endpoint.description}</p>

                        {expandedEndpoints[endpoint.path] && (
                          <div className="mt-4 space-y-4">
                            {endpoint.requestBody && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">Request Body:</h4>
                                <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto">
                                  <code className="text-sm text-gray-800">{endpoint.requestBody}</code>
                                </pre>
                              </div>
                            )}

                            {endpoint.responseBody && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">Response Body:</h4>
                                <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto">
                                  <code className="text-sm text-gray-800">{endpoint.responseBody}</code>
                                </pre>
                              </div>
                            )}

                            {endpoint.example && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">Beispiel:</h4>
                                <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto">
                                  <code className="text-sm text-gray-800">{endpoint.example}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
} 