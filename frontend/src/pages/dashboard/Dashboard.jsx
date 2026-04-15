import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import api from '../../api/axios';
import { Users, Brain, Activity, Clock, RefreshCcw } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboards/summary/')
      .then(res => setData(res.data))
      .catch(err => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center">
      <RefreshCcw className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="text-gray-500 animate-pulse">Cargando métricas...</p>
    </div>
  );

  if (!data?.kpis) return <div className="p-10 text-center text-red-500">Error al cargar datos.</div>;

  const { kpis, chart_data } = data;

  const lineConfig = {
    labels: chart_data.map(d => d.date),
    datasets: [
      {
        label: 'Asistencia %',
        data: chart_data.map(d => d.asistencia),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Atención %',
        data: chart_data.map(d => d.atencion),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const pieData = {
    labels: ['Atención', 'Fatiga', 'En Proceso'],
    datasets: [
      {
        data: [kpis.attention_avg, kpis.fatigue_alerts, kpis.processing_tasks],
        backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b'],
        hoverOffset: 4
      }
    ]
  };

  const attendancePieData = {
    labels: ['Presentes', 'Ausentes'],
    datasets: [
      {
        data: [kpis.attendance_avg, 100 - kpis.attendance_avg],
        backgroundColor: [
          '#10b981',
          '#f43f5e',
        ],
        hoverOffset: 4,
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Panel de Análisis" subtitle="Resumen de rendimiento y estado de alumnos" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Asistencia" value={`${kpis.attendance_avg}%`} icon={<Users />} color="blue" />
        <StatCard title="Atención" value={`${kpis.attention_avg}%`} icon={<Brain />} color="purple" />
        <StatCard title="Alertas" value={kpis.fatigue_alerts} icon={<Activity />} color="red" />
        <StatCard title="En Proceso" value={kpis.processing_tasks} icon={<Clock />} color="amber" />
      </div>

      <div className="space-y-6">

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Evolución de Clase</h3>
          <div className="h-[300px]">
            <Line data={lineConfig} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Distribución de Estado</h3>
            <div className="h-[250px] flex items-center justify-center">
              <Doughnut data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Asistencia</h3>
            <div className="h-[250px] flex items-center justify-center">
              <Doughnut data={attendancePieData} options={{ maintainAspectRatio: false }} />
            </div>
            <p className="text-center text-sm font-medium text-gray-500 mt-2">
              {kpis.attendance_avg}% de asistencia total
            </p>
          </div>

        </div>
      </div>


    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-xl ${styles[color]}`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}