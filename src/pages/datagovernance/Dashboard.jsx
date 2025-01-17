const Dashboard = () => {
  const metrics = [
    {
      title: 'Technical',
      icon: '🔧',
      stats: [
        { label: 'Connectors', value: '07' },
        { label: 'Schema', value: '20' },
        { label: 'Tables', value: '39' },
        { label: 'Columns', value: '77' },
      ],
      bgColor: 'bg-cyan-100',
      textColor: 'text-cyan-600',
      borderColor: 'border-cyan-500',
    },
    {
      title: 'Business',
      icon: '💼',
      stats: [
        { label: 'Domain', value: '12' },
        { label: 'Terms', value: '44' },
        { label: 'Definitions', value: '29' },
        { label: 'LOB', value: '06' },
      ],
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-500',
    },
    {
      title: 'Operational',
      icon: '🔗',
      stats: [
        { label: 'Policies', value: '71' },
        { label: 'Tags', value: '60' },
        { label: 'Rules', value: '68' },
        { label: 'Persona', value: '17' },
      ],
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 rounded-lg ${section.iconBgColor} flex items-center justify-center`}>
                <span className="text-xl">{section.icon}</span>
              </div>
              <h3 className="text-lg font-medium">{section.title}</h3>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {section.stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`pb-3 ${section.borderColor} border-b-2`}
                >
                  <p className="text-lg font-semibold mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
