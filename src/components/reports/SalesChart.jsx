'use client';

import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler);

export function SalesChart({ dailyBreakdown }) {
    const formatCurrency = (val) => Number(val || 0).toLocaleString() + ' ج.م';

    const chartData = {
        labels: (dailyBreakdown || []).map(d =>
            new Date(d.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
        ).reverse(),
        datasets: [
            {
                label: 'المبيعات',
                data: (dailyBreakdown || []).map(d => d.totalRevenue || 0).reverse(),
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.8)');
                    return gradient;
                },
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderRadius: 12,
                hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
                barPercentage: 0.6,
            },
            {
                label: 'الأرباح',
                data: (dailyBreakdown || []).map(d => d.grossProfit || 0).reverse(),
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');
                    return gradient;
                },
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
                borderRadius: 12,
                hoverBackgroundColor: 'rgba(16, 185, 129, 1)',
                barPercentage: 0.6,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                rtl: true,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: 'Inter, sans-serif',
                        size: 12,
                        weight: '900',
                    },
                    color: 'rgba(255, 255, 255, 0.4)',
                }
            },
            tooltip: {
                rtl: true,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: {
                    family: 'Inter, sans-serif',
                    size: 14,
                    weight: 'bold',
                },
                bodyFont: {
                    family: 'mono',
                    size: 12,
                },
                padding: 16,
                borderRadius: 16,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: 'mono',
                        size: 10,
                        weight: 'bold',
                    },
                    color: 'rgba(255, 255, 255, 0.2)',
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    font: {
                        family: 'mono',
                        size: 10,
                    },
                    color: 'rgba(255, 255, 255, 0.2)',
                    callback: function (value) {
                        return value.toLocaleString();
                    }
                }
            }
        }
    };

    return (
        <div className="h-[400px] w-full">
            <Bar data={chartData} options={chartOptions} />
        </div>
    );
}
