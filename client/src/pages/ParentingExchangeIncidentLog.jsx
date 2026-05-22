import { useEffect, useState } from 'react';

export default function ParentingExchangeIncidentLog() {
  const [data, setData] = useState({ summary: {}, incidents: [] });
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    fetch('/api/parenting-exchange-incident-log').then((res) => res.json()).then(setData);
  }, []);

  const createPlan = async (incidentId) => {
    const res = await fetch('/api/parenting-exchange-incident-log/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId }),
    });
    setPlan(await res.json());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parenting Exchange Incident Log</h1>
        <p className="text-gray-600">Track neutral exchange facts, severity, and follow-up steps for co-parenting records.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(data.summary).map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg border p-4"><div className="text-sm text-gray-500">{key}</div><div className="text-2xl font-semibold">{value}</div></div>
        ))}
      </div>
      {data.incidents.map((incident) => (
        <div key={incident.id} className="bg-white rounded-lg border p-4">
          <div className="font-semibold">{incident.child} · {incident.category}</div>
          <div className="text-sm text-gray-600">{incident.exchangeDate} at {incident.location} · {incident.severity}</div>
          <button className="mt-3 px-3 py-2 rounded bg-blue-600 text-white" onClick={() => createPlan(incident.id)}>Create neutral plan</button>
        </div>
      ))}
      {plan && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">{plan.neutralSummary} {plan.nextSteps.join(' · ')}</div>}
    </div>
  );
}
