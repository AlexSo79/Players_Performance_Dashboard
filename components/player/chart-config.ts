export const METRIC_CONFIG = [
    // Volume
    { label: 'Minutes', key: 'minutes', unit: 'min', category: 'Volume' },
    { label: 'Total Distance', key: 'total_distance', unit: 'm', category: 'Volume' },
    { label: 'Distance/Min', key: 'distance_min', unit: 'm/min', category: 'Volume' },
    { label: 'Eq. Rel. Distance', key: 'equivalent_relative_distance', unit: 'm', category: 'Volume' },
    { label: '% Eq. Rel. Distance', key: 'pct_equivalent_relative_distance', unit: '%', category: 'Volume' },

    // Intensity
    { label: 'Max Speed', key: 'max_speed', unit: 'km/h', category: 'Intensity' },
    { label: 'High Speed Running', key: 'high_speed_running', unit: 'm', category: 'Intensity' },
    { label: 'Sprint Running', key: 'sprint_running', unit: 'm', category: 'Intensity' },
    { label: 'HI Dist/Min', key: 'distance_hi_min', unit: 'm/min', category: 'Intensity' },
    { label: '% Sprint of HI', key: 'pct_distance_sprint_hi', unit: '%', category: 'Intensity' },
    { label: 'Dist > 80% Max', key: 'distance_over_80_pct_max_speed', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 90% Max', key: 'distance_over_90_pct_max_speed', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 14.4km/h', key: 'distance_over_14_4_kmh', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 25 W/kg', key: 'distance_over_25_w_kg', unit: 'm', category: 'Intensity' },

    // Accelerations
    { label: '# Acc > 2.5', key: 'number_acc_over_25_kmh', unit: '', category: 'Accelerations' },
    { label: 'Acc Dist (>2.5)', key: 'distance_acc_over_2_5_ms', unit: 'm', category: 'Accelerations' },
    { label: 'Dec Dist (>2.5)', key: 'distance_dec_over_2_5_ms', unit: 'm', category: 'Accelerations' },
    { label: 'Acc HI/Min', key: 'distance_acc_hi_min', unit: 'm/min', category: 'Accelerations' },
    { label: 'Dec HI/Min', key: 'distance_dece_hi_min', unit: 'm/min', category: 'Accelerations' },
    { label: '% Acc HI', key: 'pct_distance_acc_hi', unit: '%', category: 'Accelerations' },
    { label: '% Dec HI', key: 'pct_distance_dec_hi', unit: '%', category: 'Accelerations' },

    // Load
    { label: 'Training Load', key: 'training_load', unit: 'AU', category: 'Load' },
    { label: 'Strength Index', key: 'strength_index', unit: '%', category: 'Load' },
    { label: 'EEE', key: 'eee', unit: 'kJ', category: 'Load' },
    { label: 'AMP', key: 'amp', unit: 'W/kg', category: 'Load' },
    { label: 'Player Load', key: 'player_load', unit: 'AU', category: 'Load' },
    { label: 'Anaerobic Index %', key: 'pct_ai', unit: '%', category: 'Load' },
    { label: '# Acc > 3m/s', key: 'number_acc_over_3_ms', unit: '', category: 'Accelerations' },
    { label: '# Dec < -3m/s', key: 'number_dec_under_minus_3_ms', unit: '', category: 'Accelerations' },
    { label: 'Dist MP HI', key: 'distance_mphi', unit: 'm', category: 'Load' },
    { label: '% Dist MP HI', key: 'pct_distance_mphi', unit: '%', category: 'Load' },
]
