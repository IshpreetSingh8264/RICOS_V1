require('dotenv').config({ path: './.env' });
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DEFAULT_TEST_PASSWORD = 'testtest';
const pincodePolygonMap = new Map();

// ---------------------------------------------------------------------------
// GeoJSON loader — exact pincode → polygon + centroid
// ---------------------------------------------------------------------------
function loadPincodePolygons() {
  const geojsonPath = path.join(process.cwd(), 'geojsonData', 'data.geojson');
  if (!fs.existsSync(geojsonPath)) {
    console.warn(`[seed] GeoJSON not found at ${geojsonPath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
  for (const feature of (data.features || [])) {
    const pincode = feature?.properties?.Pincode || feature?.properties?.pincode;
    if (!pincode || !feature?.geometry) continue;

    const ring =
      feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates[0]
        : feature.geometry.coordinates[0][0];

    const cx = ring.reduce((s, c) => s + c[0], 0) / ring.length;
    const cy = ring.reduce((s, c) => s + c[1], 0) / ring.length;

    pincodePolygonMap.set(String(pincode), {
      pincode: String(pincode),
      polygon: feature.geometry,
      centerLat: parseFloat(cy.toFixed(5)),
      centerLng: parseFloat(cx.toFixed(5)),
      district: feature?.properties?.district || feature?.properties?.Division || '',
      office: feature?.properties?.Office_Name || '',
    });
  }

  console.log(`[seed] Loaded ${pincodePolygonMap.size} pincode polygons`);
}

function getPincode(code) {
  const entry = pincodePolygonMap.get(String(code));
  if (!entry) throw new Error(`[seed] Pincode ${code} not found in GeoJSON!`);
  return entry;
}

// ---------------------------------------------------------------------------
// MULTIPLE USER SEEDS — regular users in various cities
// ---------------------------------------------------------------------------
const USER_SEEDS = [
  {
    email: 'aman.singh.1996@mail.com',
    full_name: 'Aman Singh',
    dob: new Date('1996-03-15'),
    gender: 'Male',
    phone_number: '9876543210',
    alternate_phone: '9876543211',
    current_address: '45, Punjabi Lane, Ludhiana',
    pincode: '141003',
    city: 'Ludhiana',
    state: 'Punjab',
    aadhar_id: '112233445566',
    blood_group: 'O+',
    medical_conditions: 'None',
    allergies: 'Penicillin',
    disabilities: '',
    emergency_contact_name: 'Priya Singh',
    emergency_contact_relation: 'Wife',
    emergency_contact_phone: '9876543212',
    primary_language: 'Punjabi',
    secondary_language: 'Hindi',
  },
  {
    email: 'rajesh.kumar.amritsar@mail.com',
    full_name: 'Rajesh Kumar',
    dob: new Date('1990-07-22'),
    gender: 'Male',
    phone_number: '9765432109',
    alternate_phone: '9765432110',
    current_address: '78, Golden Avenue, Amritsar',
    pincode: '143001',
    city: 'Amritsar',
    state: 'Punjab',
    aadhar_id: '223344556677',
    blood_group: 'B+',
    medical_conditions: 'Hypertension (controlled)',
    allergies: '',
    disabilities: '',
    emergency_contact_name: 'Sharma Devi',
    emergency_contact_relation: 'Mother',
    emergency_contact_phone: '9765432111',
    primary_language: 'Punjabi',
    secondary_language: 'English',
  },
  {
    email: 'neha.sharma.jallundur@mail.com',
    full_name: 'Neha Sharma',
    dob: new Date('1998-11-08'),
    gender: 'Female',
    phone_number: '9654321098',
    alternate_phone: '9654321099',
    current_address: '102, Shastri Nagar, Jalandhar',
    pincode: '144005',
    city: 'Jalandhar',
    state: 'Punjab',
    aadhar_id: '334455667788',
    blood_group: 'A+',
    medical_conditions: '',
    allergies: 'Sulfa drugs',
    disabilities: '',
    emergency_contact_name: 'Vikram Sharma',
    emergency_contact_relation: 'Brother',
    emergency_contact_phone: '9654321100',
    primary_language: 'Punjabi',
    secondary_language: 'Hindi',
  },
];

// ---------------------------------------------------------------------------
// NGO SEEDS — 4 original NGOs (from original script)
// ---------------------------------------------------------------------------
const NGO_SEEDS = [
  {
    email: 'ops@safeshelterfoundation.org',
    ngo_name: 'Safe Shelter Foundation',
    registration_number: 'PB/NGO/2014/44721',
    ngo_type: 'Disaster Relief',
    year_established: 2014,
    mission_statement: 'Rapid rescue and relief operations for flood-affected communities in the Majha belt.',
    official_contact: '9888801122',
    alternate_contact: '9888801188',
    website: 'https://safeshelterfoundation.org',
    registered_address: 'SCF 55, Ranjit Avenue, Amritsar, Punjab',
    operational_areas: 'Amritsar, Tarn Taran, Gurdaspur, Batala',
    location_lat: 31.6334,
    location_lng: 74.8649,
    admin_name: 'Nidhi Arora',
    admin_designation: 'Operations Director',
    admin_mobile: '9872214455',
    admin_email: 'nidhi.arora@safeshelterfoundation.org',
    aadhar_card: '772188440011',
    resource_types: 'ambulance,medical_kits,rescue_boats,dry_rations,tents,water_purifiers',
    team_strength: 52,
    bank_account_number: '55890122004411',
    services_provided: 'Flood rescue, emergency medical response, evacuation logistics, shelter management',
    inventory: [
      { item: 'Inflatable Rescue Boat', total_quantity: 9 },
      { item: 'Emergency Trauma Kit', total_quantity: 160 },
      { item: 'Portable Water Purifier', total_quantity: 40 },
      { item: 'Family Relief Ration Pack', total_quantity: 520 },
      { item: 'Thermal Blanket', total_quantity: 700 },
      { item: 'Medical Oxygen Cylinder', total_quantity: 35 },
      { item: 'Emergency Shelter Tent', total_quantity: 90 },
    ],
    teams: [
      {
        name: 'Amritsar City Flood Response Unit',
        username: 'safe_shelter_amritsar_city_flood_response_unit',
        email: 'amritsarcityfloodresponse.safeshelterfoundation@groups.ricos.com',
        latitude: 31.6334, longitude: 74.8649, accuracy: 15, status: 'deployed', battery_level: 82,
        allocations: [['Inflatable Rescue Boat', 2], ['Emergency Trauma Kit', 35], ['Family Relief Ration Pack', 100], ['Medical Oxygen Cylinder', 8]],
      },
      {
        name: 'Majha Riverbank Recon Squad',
        username: 'safe_shelter_majha_riverbank_recon_squad',
        email: 'majhariverbankreconsquad.safeshelterfoundation@groups.ricos.com',
        latitude: 31.6278, longitude: 74.8402, accuracy: 16, status: 'rescuing', battery_level: 68,
        allocations: [['Inflatable Rescue Boat', 2], ['Emergency Trauma Kit', 28], ['Portable Water Purifier', 8], ['Family Relief Ration Pack', 80]],
      },
      {
        name: 'Tarn Taran Floodline Alpha',
        username: 'safe_shelter_tarn_taran_floodline_alpha',
        email: 'tarntaranfloodlinealpha.safeshelterfoundation@groups.ricos.com',
        latitude: 31.4284, longitude: 74.9294, accuracy: 18, status: 'deployed', battery_level: 71,
        allocations: [['Inflatable Rescue Boat', 2], ['Emergency Trauma Kit', 30], ['Portable Water Purifier', 9], ['Thermal Blanket', 150]],
      },
      {
        name: 'Batala-Gurdaspur Medical Wing',
        username: 'safe_shelter_batala_gurdaspur_medical_wing',
        email: 'batalagurdaspurmedicalwing.safeshelterfoundation@groups.ricos.com',
        latitude: 31.8137, longitude: 75.2043, accuracy: 19, status: 'available', battery_level: 88,
        allocations: [['Emergency Trauma Kit', 40], ['Medical Oxygen Cylinder', 10], ['Thermal Blanket', 200], ['Emergency Shelter Tent', 25]],
      },
    ],
  },
  {
    email: 'coordination@sevaresponsecollective.in',
    ngo_name: 'Seva Response Collective',
    registration_number: 'PB/NGO/2017/55214',
    ngo_type: 'Community Rescue & Relief',
    year_established: 2017,
    mission_statement: 'Hyper-local emergency response with medical triage, evacuation, and supply chain support across Majha.',
    official_contact: '9815402210',
    alternate_contact: '9815402211',
    website: 'https://sevaresponsecollective.in',
    registered_address: 'SCF 18, Ranjit Avenue, Amritsar, Punjab',
    operational_areas: 'Amritsar, Tarn Taran, Gurdaspur, Pathankot',
    location_lat: 31.6390,
    location_lng: 74.8257,
    admin_name: 'Harleen Bajwa',
    admin_designation: 'Chief Response Coordinator',
    admin_mobile: '9815411100',
    admin_email: 'harleen.bajwa@sevaresponsecollective.in',
    aadhar_card: '661177223344',
    resource_types: 'ambulance,first_aid,boats,drones,dry_food,sanitation_kits',
    team_strength: 46,
    bank_account_number: '66321999124567',
    services_provided: 'Urban flood rescue, drone reconnaissance, first aid camps, inter-district logistics',
    inventory: [
      { item: 'Inflatable Rescue Boat', total_quantity: 6 },
      { item: 'Emergency Trauma Kit', total_quantity: 120 },
      { item: 'Portable Water Purifier', total_quantity: 28 },
      { item: 'Dry Food Packet', total_quantity: 640 },
      { item: 'Sanitation Hygiene Kit', total_quantity: 420 },
      { item: 'Search Drone Unit', total_quantity: 7 },
      { item: 'Emergency Shelter Tent', total_quantity: 60 },
    ],
    teams: [
      {
        name: 'Amritsar Urban Rescue Team',
        username: 'seva_response_amritsar_urban_rescue_team',
        email: 'amritsarurbanrescueteam.sevaresponsecollective@groups.ricos.com',
        latitude: 31.6092, longitude: 74.8959, accuracy: 14, status: 'rescuing', battery_level: 75,
        allocations: [['Inflatable Rescue Boat', 1], ['Emergency Trauma Kit', 22], ['Dry Food Packet', 160], ['Search Drone Unit', 2]],
      },
      {
        name: 'Tarn Taran Floodline Beta',
        username: 'seva_response_tarn_taran_floodline_beta',
        email: 'tarntaranfloodlinebeta.sevaresponsecollective@groups.ricos.com',
        latitude: 31.4580, longitude: 74.9229, accuracy: 19, status: 'deployed', battery_level: 76,
        allocations: [['Inflatable Rescue Boat', 2], ['Emergency Trauma Kit', 28], ['Portable Water Purifier', 7], ['Sanitation Hygiene Kit', 110]],
      },
    ],
  },
  {
    email: 'ops@punjabreliefnetwork.in',
    ngo_name: 'Punjab Relief Network',
    registration_number: 'PB/NGO/2012/33109',
    ngo_type: 'Relief Logistics',
    year_established: 2012,
    mission_statement: 'Warehouse-backed relief logistics and rapid deployment teams for Majha belt flood emergencies.',
    official_contact: '9876403200',
    alternate_contact: '9876403201',
    website: 'https://punjabreliefnetwork.in',
    registered_address: 'Warehouse 12, GT Road, Amritsar, Punjab',
    operational_areas: 'Amritsar, Gurdaspur, Batala, Ajnala, Attari',
    location_lat: 31.6705,
    location_lng: 74.8645,
    admin_name: 'Rohit Khosla',
    admin_designation: 'Field Ops Lead',
    admin_mobile: '9876404500',
    admin_email: 'rohit.khosla@punjabreliefnetwork.in',
    aadhar_card: '551133779955',
    resource_types: 'rations,blankets,boats,vehicles,medical,water_purifiers',
    team_strength: 58,
    bank_account_number: '99001122887766',
    services_provided: 'Relief warehousing, district transport corridors, medical camp setup, temporary shelters',
    inventory: [
      { item: 'Inflatable Rescue Boat', total_quantity: 7 },
      { item: 'Emergency Trauma Kit', total_quantity: 145 },
      { item: 'Portable Water Purifier', total_quantity: 35 },
      { item: 'Family Relief Ration Pack', total_quantity: 560 },
      { item: 'Thermal Blanket', total_quantity: 800 },
      { item: 'Emergency Shelter Tent', total_quantity: 100 },
      { item: 'Satellite Phone Unit', total_quantity: 12 },
    ],
    teams: [
      {
        name: 'Amritsar North Supply Convoy',
        username: 'punjab_relief_amritsar_north_supply_convoy',
        email: 'amritsarnorthsupplyconvoy.punjabreliefnetwork@groups.ricos.com',
        latitude: 31.6705, longitude: 74.8645, accuracy: 17, status: 'available', battery_level: 90,
        allocations: [['Family Relief Ration Pack', 200], ['Thermal Blanket', 300], ['Emergency Shelter Tent', 30], ['Satellite Phone Unit', 3]],
      },
      {
        name: 'Ajnala-Attari Field Team',
        username: 'punjab_relief_ajnala_attari_field_team',
        email: 'ajnalaattarifieldteam.punjabreliefnetwork@groups.ricos.com',
        latitude: 31.9115, longitude: 74.6983, accuracy: 22, status: 'deployed', battery_level: 73,
        allocations: [['Inflatable Rescue Boat', 2], ['Emergency Trauma Kit', 30], ['Portable Water Purifier', 9], ['Satellite Phone Unit', 3]],
      },
    ],
  },
  {
    email: 'coord@kisanfrontlineaid.org',
    ngo_name: 'Kisan Frontline Aid Society',
    registration_number: 'PB/NGO/2019/77402',
    ngo_type: 'Rural Emergency Support',
    year_established: 2019,
    mission_statement: 'Village-first emergency assistance for Majha and border-belt rural communities during monsoon floods.',
    official_contact: '9780204501',
    alternate_contact: '9780204502',
    website: 'https://kisanfrontlineaid.org',
    registered_address: 'Near Bus Stand, Tarn Taran, Punjab',
    operational_areas: 'Tarn Taran, Amritsar rural, Khalra, Bhikhiwind, Chabhal',
    location_lat: 31.4284,
    location_lng: 74.9294,
    admin_name: 'Gurkirat Mann',
    admin_designation: 'Rural Response Manager',
    admin_mobile: '9780203330',
    admin_email: 'gurkirat.mann@kisanfrontlineaid.org',
    aadhar_card: '441188990022',
    resource_types: 'tractor_support,ambulance,boats,medical,food,temporary_shelters',
    team_strength: 49,
    bank_account_number: '77442011335599',
    services_provided: 'Rural evacuation, first aid transport, panchayat-level relief distribution, shelter setup',
    inventory: [
      { item: 'Inflatable Rescue Boat', total_quantity: 5 },
      { item: 'Emergency Trauma Kit', total_quantity: 110 },
      { item: 'Portable Water Purifier', total_quantity: 26 },
      { item: 'Family Relief Ration Pack', total_quantity: 500 },
      { item: 'Thermal Blanket', total_quantity: 620 },
      { item: 'Emergency Shelter Tent', total_quantity: 88 },
      { item: 'Rural Evacuation Vehicle', total_quantity: 16 },
    ],
    teams: [
      {
        name: 'Tarn Taran Rural Evacuation Squad',
        username: 'kisan_tarn_taran_rural_evacuation_squad',
        email: 'tarntaranruralevacuationsquad.kisanfrontlineaid@groups.ricos.com',
        latitude: 31.3607, longitude: 74.8805, accuracy: 16, status: 'rescuing', battery_level: 61,
        allocations: [['Emergency Trauma Kit', 22], ['Family Relief Ration Pack', 140], ['Rural Evacuation Vehicle', 5], ['Emergency Shelter Tent', 20]],
      },
      {
        name: 'Khalra-Bhikhiwind Relief Unit',
        username: 'kisan_khalra_bhikhiwind_relief_unit',
        email: 'khalrabhikhiwindreliefunit.kisanfrontlineaid@groups.ricos.com',
        latitude: 31.3728, longitude: 74.5828, accuracy: 20, status: 'deployed', battery_level: 70,
        allocations: [['Inflatable Rescue Boat', 2], ['Portable Water Purifier', 8], ['Emergency Trauma Kit', 28], ['Family Relief Ration Pack', 120]],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// GOVERNMENT SEEDS — NDRF, Punjab Police Rescue
// ---------------------------------------------------------------------------
const GOVT_SEEDS = [
  {
    email: 'operations@ndrf-punjab-hq.gov.in',
    agency_name: 'National Disaster Response Force (NDRF) - Punjab Wing',
    department: 'Ministry of Home Affairs',
    govt_level: 'Central',
    official_id: 'NDRF/PB/2024/001',
    department_code: 'DM-NDRF-PB',
    hq_address: 'NDRF Battalion Headquarters, Stadium Road, Amritsar, Punjab 143001',
    incharge_name: 'Col. Amar Jeet Singh',
    incharge_mobile: '9912001234',
    incharge_email: 'col.amar.jeet@ndrf.gov.in',
    control_room_number: '0183-2550999',
    jurisdiction_area: 'Punjab (North-Eastern Districts)',
    resource_types: 'rescue_boats,swift_water_rescue,airlift_capability,medical_response,deployment_teams',
    resource_capacity: 180,
    bank_account_number: '123000789012345',
    services_provided: 'Rapid response to natural disasters, flood rescue, search and rescue, disaster management training',
    inventory: [
      { item: 'Rigid Hull Inflatable Boat (RHIB)', total_quantity: 12 },
      { item: 'High-Capacity Water Pump', total_quantity: 8 },
      { item: 'Advanced Rescue Kit', total_quantity: 45 },
      { item: 'Deployment Helicopter (on-call)', total_quantity: 2 },
      { item: 'Field Medical Unit', total_quantity: 6 },
      { item: 'Satellite Communication Set', total_quantity: 4 },
      { item: 'Emergency Food Ration (bulk)', total_quantity: 1200 },
    ],
    teams: [
      {
        name: 'NDRF Amritsar Swift Water Rescue Team',
        username: 'ndrf_amritsar_swift_water_rescue',
        email: 'amritsar.swr.ndrf@groups.ricos.com',
        latitude: 31.6334, longitude: 74.8649, accuracy: 10, status: 'deployed', battery_level: 95,
        allocations: [['Rigid Hull Inflatable Boat (RHIB)', 3], ['Advanced Rescue Kit', 15], ['Field Medical Unit', 2], ['Satellite Communication Set', 1]],
      },
      {
        name: 'NDRF Gurdaspur Heavy Equipment Unit',
        username: 'ndrf_gurdaspur_heavy_equipment',
        email: 'gurdaspur.heu.ndrf@groups.ricos.com',
        latitude: 32.0452, longitude: 75.3902, accuracy: 12, status: 'available', battery_level: 92,
        allocations: [['Rigid Hull Inflatable Boat (RHIB)', 2], ['High-Capacity Water Pump', 4], ['Advanced Rescue Kit', 12], ['Emergency Food Ration (bulk)', 300]],
      },
      {
        name: 'NDRF Tarn Taran Medical Response Team',
        username: 'ndrf_tarn_taran_medical_response',
        email: 'tarntaran.med.ndrf@groups.ricos.com',
        latitude: 31.4284, longitude: 74.9294, accuracy: 11, status: 'deployed', battery_level: 88,
        allocations: [['Advanced Rescue Kit', 18], ['Field Medical Unit', 2], ['Emergency Food Ration (bulk)', 400], ['Satellite Communication Set', 1]],
      },
    ],
  },
  {
    email: 'operations@pbp-rescue-wing.gov.in',
    agency_name: 'Punjab Police Disaster Management & Rescue Wing',
    department: 'Punjab Police',
    govt_level: 'State',
    official_id: 'PP/RESCUE/PB/2024/001',
    department_code: 'DM-PP-RESCUE',
    hq_address: 'Police Headquarters, Sector 17, Chandigarh, Punjab 160017',
    incharge_name: 'SP Priya Sharma (Retd. Training)',
    incharge_mobile: '9813002344',
    incharge_email: 'sp.priya.sharma@punjabpolice.gov.in',
    control_room_number: '0172-5055555',
    jurisdiction_area: 'Punjab (All Districts)',
    resource_types: 'rapid_response_vehicles,trained_personnel,communication_network,local_coordination,civil_defense_volunteers',
    resource_capacity: 250,
    bank_account_number: '456000123456789',
    services_provided: 'Rapid disaster response, crowd management, local coordination with civil authorities, rescue operations',
    inventory: [
      { item: 'Police Rapid Response Vehicle', total_quantity: 18 },
      { item: 'Portable Evacuation Kit', total_quantity: 60 },
      { item: 'Communication Radio Set (Mobile)', total_quantity: 25 },
      { item: 'First Aid Station (Field-Mobile)', total_quantity: 15 },
      { item: 'Disaster Liaison Officer Kit', total_quantity: 10 },
      { item: 'Emergency Shelter Supply Pack', total_quantity: 400 },
      { item: 'Crowd Control Equipment Set', total_quantity: 8 },
    ],
    teams: [
      {
        name: 'Amritsar Police Response Unit',
        username: 'punjab_police_amritsar_response_unit',
        email: 'amritsar.response.pp@groups.ricos.com',
        latitude: 31.6334, longitude: 74.8649, accuracy: 12, status: 'deployed', battery_level: 87,
        allocations: [['Police Rapid Response Vehicle', 4], ['Portable Evacuation Kit', 12], ['Communication Radio Set (Mobile)', 6], ['First Aid Station (Field-Mobile)', 3]],
      },
      {
        name: 'Gurdaspur Police Coordination Cell',
        username: 'punjab_police_gurdaspur_coord_cell',
        email: 'gurdaspur.coord.pp@groups.ricos.com',
        latitude: 32.0452, longitude: 75.3902, accuracy: 13, status: 'available', battery_level: 90,
        allocations: [['Police Rapid Response Vehicle', 3], ['Portable Evacuation Kit', 10], ['Communication Radio Set (Mobile)', 5], ['Disaster Liaison Officer Kit', 3]],
      },
      {
        name: 'Tarn Taran Police Flood Relief Team',
        username: 'punjab_police_tarn_taran_flood_relief',
        email: 'tarntaran.relief.pp@groups.ricos.com',
        latitude: 31.4284, longitude: 74.9294, accuracy: 11, status: 'deployed', battery_level: 85,
        allocations: [['Police Rapid Response Vehicle', 3], ['Portable Evacuation Kit', 15], ['First Aid Station (Field-Mobile)', 3], ['Emergency Shelter Supply Pack', 150]],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// VOLUNTEER SEEDS — Khalsa Rescue, Youth Care
// ---------------------------------------------------------------------------
const VOLUNTEER_SEEDS = [
  {
    email: 'coordination@khalsa-rescue-amritsar.org',
    group_name: 'Khalsa Rescue Team Amritsar',
    volunteer_type: 'Community Disaster Response',
    group_size: 85,
    operational_areas: 'Amritsar City, Amritsar Rural Blocks, Gurdaspur Buffer Zone',
    social_media_link: 'https://facebook.com/khalsa-rescue-amritsar',
    leader_name: 'Harvinder Singh',
    leader_phone: '9988776655',
    leader_email: 'harvinder.singh@khalsa-rescue-amritsar.org',
    id_proof: 'AADHAR/9911223344',
    has_medical_training: true,
    has_first_aid_cert: true,
    has_vehicle: true,
    languages_spoken: 'Punjabi, Hindi, English',
    inventory: [
      { item: 'Community Rescue Boat', total_quantity: 4 },
      { item: 'First Aid Kit (Community)', total_quantity: 25 },
      { item: 'Water Purification Tablet Box', total_quantity: 50 },
      { item: 'Community Relief Food Pack', total_quantity: 300 },
      { item: 'Emergency Tarpaulin Sheet', total_quantity: 120 },
      { item: 'Community Communication Walkie-Talkie', total_quantity: 10 },
      { item: 'Volunteer Transportation Van', total_quantity: 3 },
    ],
    teams: [
      {
        name: 'Khalsa Amritsar City Rescue Wing',
        username: 'khalsa_amritsar_city_rescue_wing',
        email: 'amritsar.city.rescue.khalsa@groups.ricos.com',
        latitude: 31.6334, longitude: 74.8649, accuracy: 14, status: 'deployed', battery_level: 80,
        allocations: [['Community Rescue Boat', 2], ['First Aid Kit (Community)', 8], ['Community Relief Food Pack', 100], ['Emergency Tarpaulin Sheet', 40]],
      },
      {
        name: 'Khalsa Rural Evacuation Support',
        username: 'khalsa_rural_evacuation_support',
        email: 'rural.evacuation.khalsa@groups.ricos.com',
        latitude: 31.7200, longitude: 74.7500, accuracy: 16, status: 'available', battery_level: 78,
        allocations: [['Community Rescue Boat', 1], ['First Aid Kit (Community)', 8], ['Community Relief Food Pack', 120], ['Volunteer Transportation Van', 2]],
      },
      {
        name: 'Khalsa Gurdaspur Border Cell',
        username: 'khalsa_gurdaspur_border_cell',
        email: 'gurdaspur.border.khalsa@groups.ricos.com',
        latitude: 32.0452, longitude: 75.3902, accuracy: 15, status: 'rescuing', battery_level: 72,
        allocations: [['Community Rescue Boat', 1], ['First Aid Kit (Community)', 6], ['Water Purification Tablet Box', 15], ['Community Communication Walkie-Talkie', 3]],
      },
    ],
  },
  {
    email: 'coordination@youth-care-volunteers.org',
    group_name: 'Youth Care Volunteers Network',
    volunteer_type: 'Youth-Led Social Response',
    group_size: 120,
    operational_areas: 'Amritsar, Tarn Taran, Jalandhar, Ludhiana Outlying Areas',
    social_media_link: 'https://facebook.com/youth-care-volunteers',
    leader_name: 'Simran Kaur',
    leader_phone: '9977665544',
    leader_email: 'simran.kaur@youth-care-volunteers.org',
    id_proof: 'AADHAR/8822334455',
    has_medical_training: false,
    has_first_aid_cert: true,
    has_vehicle: true,
    languages_spoken: 'Punjabi, Hindi, English',
    inventory: [
      { item: 'Youth Community Boat', total_quantity: 3 },
      { item: 'Youth First Aid Station', total_quantity: 20 },
      { item: 'Hot Meal Distribution Container', total_quantity: 15 },
      { item: 'Youth Relief Supply Bundle', total_quantity: 250 },
      { item: 'Portable Generator (Community)', total_quantity: 5 },
      { item: 'Youth Communication Network Device', total_quantity: 8 },
      { item: 'Youth Support Service Vehicle', total_quantity: 4 },
    ],
    teams: [
      {
        name: 'Youth Care Amritsar Relief Cell',
        username: 'youth_care_amritsar_relief_cell',
        email: 'amritsar.relief.youthcare@groups.ricos.com',
        latitude: 31.6334, longitude: 74.8649, accuracy: 15, status: 'deployed', battery_level: 76,
        allocations: [['Youth Community Boat', 1], ['Youth First Aid Station', 6], ['Hot Meal Distribution Container', 4], ['Youth Relief Supply Bundle', 80]],
      },
      {
        name: 'Youth Care Tarn Taran Support Team',
        username: 'youth_care_tarn_taran_support',
        email: 'tarntaran.support.youthcare@groups.ricos.com',
        latitude: 31.4284, longitude: 74.9294, accuracy: 14, status: 'available', battery_level: 82,
        allocations: [['Youth Community Boat', 1], ['Youth First Aid Station', 7], ['Hot Meal Distribution Container', 5], ['Youth Relief Supply Bundle', 100]],
      },
      {
        name: 'Youth Care Jalandhar-Ludhiana Outreach',
        username: 'youth_care_jalandhar_ludhiana_outreach',
        email: 'jalandhar.ludhiana.youthcare@groups.ricos.com',
        latitude: 30.9050, longitude: 75.8573, accuracy: 17, status: 'deployed', battery_level: 74,
        allocations: [['Youth Community Boat', 1], ['Youth First Aid Station', 7], ['Portable Generator (Community)', 2], ['Youth Relief Supply Bundle', 70]],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// DB wipe — truncate everything
// ---------------------------------------------------------------------------
async function wipeDatabase() {
  console.log('[seed] Wiping entire database...');
  // Delete in dependency order
  await prisma.groupLocation.deleteMany({});
  await prisma.groupResourceAllocation.deleteMany({});
  await prisma.groupAssignment.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.responder.deleteMany({});
  await prisma.disasterReport.deleteMany({});
  await prisma.allUsers.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.nGO.deleteMany({});
  await prisma.government.deleteMany({});
  await prisma.volunteer.deleteMany({});
  console.log('[seed] Database wiped.');
}

// ---------------------------------------------------------------------------
// Create multiple users
// ---------------------------------------------------------------------------
async function createUsers() {
  const passwordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
  const createdUsers = [];

  for (const userSeed of USER_SEEDS) {
    const user = await prisma.user.create({
      data: {
        email: userSeed.email,
        full_name: userSeed.full_name,
        dob: userSeed.dob,
        gender: userSeed.gender,
        phone_number: userSeed.phone_number,
        alternate_phone: userSeed.alternate_phone,
        current_address: userSeed.current_address,
        pincode: userSeed.pincode,
        city: userSeed.city,
        state: userSeed.state,
        country: 'India',
        aadhar_id: userSeed.aadhar_id,
        blood_group: userSeed.blood_group,
        medical_conditions: userSeed.medical_conditions,
        allergies: userSeed.allergies,
        disabilities: userSeed.disabilities,
        emergency_contact_name: userSeed.emergency_contact_name,
        emergency_contact_relation: userSeed.emergency_contact_relation,
        emergency_contact_phone: userSeed.emergency_contact_phone,
        primary_language: userSeed.primary_language,
        secondary_language: userSeed.secondary_language,
        communication_assistance: false,
      },
    });

    const allUser = await prisma.allUsers.create({
      data: {
        email: user.email,
        password: passwordHash,
        user_type: 'user',
        full_name: user.full_name,
        user_id: user.id,
      },
    });

    createdUsers.push({ user, allUser });
    console.log(`[seed] User created: ${userSeed.full_name}`);
  }

  return createdUsers;
}

// ---------------------------------------------------------------------------
// Create NGO with teams + inventory
// ---------------------------------------------------------------------------
async function createNgoWithTeamsAndInventory(seed) {
  const ngo = await prisma.nGO.create({
    data: {
      email: seed.email,
      ngo_name: seed.ngo_name,
      registration_number: seed.registration_number,
      ngo_type: seed.ngo_type,
      year_established: seed.year_established,
      mission_statement: seed.mission_statement,
      official_contact: seed.official_contact,
      alternate_contact: seed.alternate_contact,
      website: seed.website,
      registered_address: seed.registered_address,
      operational_areas: seed.operational_areas,
      location_lat: seed.location_lat,
      location_lng: seed.location_lng,
      admin_name: seed.admin_name,
      admin_designation: seed.admin_designation,
      admin_mobile: seed.admin_mobile,
      admin_email: seed.admin_email,
      aadhar_card: seed.aadhar_card,
      resource_types: seed.resource_types,
      team_strength: seed.team_strength,
      bank_account_number: seed.bank_account_number,
      isVerified: true,
    },
  });

  const passwordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
  const ngoAllUser = await prisma.allUsers.create({
    data: {
      email: ngo.email,
      password: passwordHash,
      user_type: 'ngo',
      full_name: seed.ngo_name,
      ngo_id: ngo.id,
    },
  });

  const responder = await prisma.responder.create({
    data: {
      ngo_id: ngo.id,
      services_provided: seed.services_provided,
      bank_account_number: ngo.bank_account_number,
      location_lat: ngo.location_lat,
      location_lng: ngo.location_lng,
      location_address: ngo.registered_address,
      isActive: true,
    },
  });

  await prisma.inventoryItem.createMany({
    data: seed.inventory.map((item) => ({
      item: item.item,
      total_quantity: item.total_quantity,
      ngo_id: ngo.id,
    })),
  });

  const inventoryItems = await prisma.inventoryItem.findMany({ where: { ngo_id: ngo.id } });
  const itemIdByName = Object.fromEntries(inventoryItems.map((i) => [i.item, i.id]));

  const teamCredentials = [];
  for (const teamSeed of seed.teams) {
    const groupPasswordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
    const group = await prisma.group.create({
      data: {
        group_name: teamSeed.name,
        username: teamSeed.username,
        email: teamSeed.email,
        password: groupPasswordHash,
        creator_type: 'ngo',
        creator_id: ngo.id,
        ngo_id: ngo.id,
        ttl_type: 'no_expiry',
        expires_at: null,
        is_active: true,
      },
    });

    for (const [itemName, qty] of teamSeed.allocations) {
      const itemId = itemIdByName[itemName];
      if (!itemId) continue;
      await prisma.groupResourceAllocation.create({
        data: { group_id: group.id, inventory_item_id: itemId, allocated_quantity: qty },
      });
    }

    await prisma.groupLocation.create({
      data: {
        group_id: group.id,
        latitude: teamSeed.latitude,
        longitude: teamSeed.longitude,
        accuracy: teamSeed.accuracy,
        status: teamSeed.status,
        battery_level: teamSeed.battery_level,
      },
    });

    teamCredentials.push({ name: teamSeed.name, email: teamSeed.email, password: DEFAULT_TEST_PASSWORD });
  }

  return { ngo, ngoAllUser, responder, teamCredentials };
}

// ---------------------------------------------------------------------------
// Create Government agency with teams + inventory
// ---------------------------------------------------------------------------
async function createGovernmentWithTeamsAndInventory(seed) {
  const govt = await prisma.government.create({
    data: {
      email: seed.email,
      agency_name: seed.agency_name,
      department: seed.department,
      govt_level: seed.govt_level,
      official_id: seed.official_id,
      department_code: seed.department_code,
      hq_address: seed.hq_address,
      incharge_name: seed.incharge_name,
      incharge_mobile: seed.incharge_mobile,
      incharge_email: seed.incharge_email,
      control_room_number: seed.control_room_number,
      jurisdiction_area: seed.jurisdiction_area,
      resource_types: seed.resource_types,
      resource_capacity: seed.resource_capacity,
      bank_account_number: seed.bank_account_number,
      isVerified: true,
    },
  });

  const passwordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
  const govtAllUser = await prisma.allUsers.create({
    data: {
      email: govt.email,
      password: passwordHash,
      user_type: 'govt',
      full_name: seed.agency_name,
      govt_id: govt.id,
    },
  });

  const responder = await prisma.responder.create({
    data: {
      govt_id: govt.id,
      services_provided: seed.services_provided,
      bank_account_number: govt.bank_account_number,
      isActive: true,
    },
  });

  await prisma.inventoryItem.createMany({
    data: seed.inventory.map((item) => ({
      item: item.item,
      total_quantity: item.total_quantity,
    })),
  });

  const inventoryItems = await prisma.inventoryItem.findMany({ where: { ngo_id: null, volunteer_id: null } });
  const itemIdByName = Object.fromEntries(inventoryItems.filter(i => seed.inventory.some(s => s.item === i.item)).map((i) => [i.item, i.id]));

  const teamCredentials = [];
  for (const teamSeed of seed.teams) {
    const groupPasswordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
    const group = await prisma.group.create({
      data: {
        group_name: teamSeed.name,
        username: teamSeed.username,
        email: teamSeed.email,
        password: groupPasswordHash,
        creator_type: 'govt',
        creator_id: govt.id,
        govt_id: govt.id,
        ttl_type: 'no_expiry',
        expires_at: null,
        is_active: true,
      },
    });

    for (const [itemName, qty] of teamSeed.allocations) {
      const itemId = itemIdByName[itemName];
      if (!itemId) continue;
      await prisma.groupResourceAllocation.create({
        data: { group_id: group.id, inventory_item_id: itemId, allocated_quantity: qty },
      });
    }

    await prisma.groupLocation.create({
      data: {
        group_id: group.id,
        latitude: teamSeed.latitude,
        longitude: teamSeed.longitude,
        accuracy: teamSeed.accuracy,
        status: teamSeed.status,
        battery_level: teamSeed.battery_level,
      },
    });

    teamCredentials.push({ name: teamSeed.name, email: teamSeed.email, password: DEFAULT_TEST_PASSWORD });
  }

  return { govt, govtAllUser, responder, teamCredentials };
}

// ---------------------------------------------------------------------------
// Create Volunteer organization with teams + inventory
// ---------------------------------------------------------------------------
async function createVolunteerWithTeamsAndInventory(seed) {
  const volunteer = await prisma.volunteer.create({
    data: {
      email: seed.email,
      group_name: seed.group_name,
      volunteer_type: seed.volunteer_type,
      group_size: seed.group_size,
      operational_areas: seed.operational_areas,
      social_media_link: seed.social_media_link,
      leader_name: seed.leader_name,
      leader_phone: seed.leader_phone,
      leader_email: seed.leader_email,
      id_proof: seed.id_proof,
      has_medical_training: seed.has_medical_training,
      has_first_aid_cert: seed.has_first_aid_cert,
      has_vehicle: seed.has_vehicle,
      languages_spoken: seed.languages_spoken,
    },
  });

  const passwordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
  const volunteerAllUser = await prisma.allUsers.create({
    data: {
      email: volunteer.email,
      password: passwordHash,
      user_type: 'volunteer',
      full_name: seed.group_name,
      volunteer_id: volunteer.id,
    },
  });

  const responder = await prisma.responder.create({
    data: {
      volunteer_id: volunteer.id,
      services_provided: `Community-led ${seed.volunteer_type}`,
      bank_account_number: '000000000000000',
      isActive: true,
    },
  });

  await prisma.inventoryItem.createMany({
    data: seed.inventory.map((item) => ({
      item: item.item,
      total_quantity: item.total_quantity,
      volunteer_id: volunteer.id,
    })),
  });

  const inventoryItems = await prisma.inventoryItem.findMany({ where: { volunteer_id: volunteer.id } });
  const itemIdByName = Object.fromEntries(inventoryItems.map((i) => [i.item, i.id]));

  const teamCredentials = [];
  for (const teamSeed of seed.teams) {
    const groupPasswordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
    const group = await prisma.group.create({
      data: {
        group_name: teamSeed.name,
        username: teamSeed.username,
        email: teamSeed.email,
        password: groupPasswordHash,
        creator_type: 'volunteer',
        creator_id: volunteer.id,
        volunteer_id: volunteer.id,
        ttl_type: 'no_expiry',
        expires_at: null,
        is_active: true,
      },
    });

    for (const [itemName, qty] of teamSeed.allocations) {
      const itemId = itemIdByName[itemName];
      if (!itemId) continue;
      await prisma.groupResourceAllocation.create({
        data: { group_id: group.id, inventory_item_id: itemId, allocated_quantity: qty },
      });
    }

    await prisma.groupLocation.create({
      data: {
        group_id: group.id,
        latitude: teamSeed.latitude,
        longitude: teamSeed.longitude,
        accuracy: teamSeed.accuracy,
        status: teamSeed.status,
        battery_level: teamSeed.battery_level,
      },
    });

    teamCredentials.push({ name: teamSeed.name, email: teamSeed.email, password: DEFAULT_TEST_PASSWORD });
  }

  return { volunteer, volunteerAllUser, responder, teamCredentials };
}

// ---------------------------------------------------------------------------
// Main seeding function
// ---------------------------------------------------------------------------
// MAJHA FLOOD INCIDENTS — covers every key pincode in the Majha region
// ---------------------------------------------------------------------------
// Generated from GeoJSON centroids — lat/lng are inside each polygon.
// status 'approved' = visible on map immediately.
// ---------------------------------------------------------------------------
const MAJHA_FLOOD_INCIDENTS = [
  // --- AMRITSAR CITY CORE ---
  { pincode: '143001', village: 'Sultanwind', severity: 'SEVERE', water_level: '5.8 ft rising', pop: 420, stuck: true, resources: 'rescue_boat,medical,food,clean_water', notes: 'Low-lying lanes flooded after drain overflow. Multiple families on rooftops.' },
  { pincode: '143002', village: 'Khalsa College Road', severity: 'SEVERE', water_level: '4.9 ft', pop: 280, stuck: true, resources: 'rescue_boat,medical,ambulance', notes: 'University belt inundated; student hostels need immediate evacuation.' },
  { pincode: '143005', village: 'GNDU Campus Area', severity: 'MODERATE', water_level: '3.1 ft', pop: 190, stuck: false, resources: 'food,clean_water,medical', notes: 'Campus roads submerged. Maintenance staff stranded.' },
  { pincode: '143006', village: 'Gandhi Bazar', severity: 'SEVERE', water_level: '5.2 ft', pop: 360, stuck: true, resources: 'rescue_boat,food,medical,tents', notes: 'Dense commercial area flooded. Ground floor shops and homes under water.' },
  { pincode: '143008', village: 'SJS Avenue', severity: 'MODERATE', water_level: '2.8 ft stable', pop: 145, stuck: false, resources: 'food,clean_water,blankets', notes: 'Residential colony with blocked drainage. Water stagnant.' },
  { pincode: '143009', village: 'Fatahpur', severity: 'MODERATE', water_level: '3.4 ft', pop: 210, stuck: true, resources: 'food,medical,clean_water', notes: 'Peri-urban settlement flooded. One elderly care home needs relocation.' },

  // --- AMRITSAR RURAL NORTH (143101-143109) ---
  { pincode: '143101', village: 'Raja Sansi', severity: 'LOW', water_level: '1.2 ft receding', pop: 65, stuck: false, resources: 'food,clean_water', notes: 'Near airport belt. Minor waterlogging on service roads.' },
  { pincode: '143102', village: 'Ajnala Town', severity: 'SEVERE', water_level: '5.4 ft rising', pop: 310, stuck: true, resources: 'rescue_boat,medical,food,ambulance', notes: 'Ravi riverside settlement. River embankment breached at two points.' },
  { pincode: '143103', village: 'Chamiari', severity: 'MODERATE', water_level: '3.7 ft', pop: 170, stuck: true, resources: 'rescue_boat,food,blankets', notes: 'Agricultural belt flooded. Cattle and families on elevated ground.' },
  { pincode: '143105', village: 'Chheharta', severity: 'SEVERE', water_level: '4.6 ft', pop: 390, stuck: true, resources: 'rescue_boat,medical,food,tents', notes: 'Industrial-residential mix area. Chemical runoff risk with floodwater.' },
  { pincode: '143107', village: 'Distillery Khasa', severity: 'MODERATE', water_level: '2.9 ft', pop: 140, stuck: false, resources: 'food,clean_water,medical', notes: 'Drainage collapse near industrial zone. Standing water not receding.' },
  { pincode: '143108', village: 'Attari Border', severity: 'SEVERE', water_level: '4.8 ft', pop: 255, stuck: true, resources: 'rescue_boat,food,medical,blankets', notes: 'Border village belt flooded. Cross-border drain overflow aggravating situation.' },
  { pincode: '143109', village: 'Chogawan', severity: 'MODERATE', water_level: '3.2 ft', pop: 160, stuck: false, resources: 'food,clean_water,sanitation', notes: 'Rural cluster near Beas river headworks. Water contamination suspected.' },

  // --- TARN TARAN DISTRICT RURAL (143301-143305) ---
  { pincode: '143301', village: 'Chabhal', severity: 'SEVERE', water_level: '5.1 ft', pop: 340, stuck: true, resources: 'rescue_boat,medical,food,tents', notes: 'Flat terrain with no natural drainage. River bund breached upstream.' },
  { pincode: '143302', village: 'Sur Singh', severity: 'SEVERE', water_level: '4.7 ft rising', pop: 295, stuck: true, resources: 'rescue_boat,ambulance,medical,food', notes: 'Village on floodplain. Multiple houses collapsed. Rescue urgent.' },
  { pincode: '143303', village: 'Bhikhiwind', severity: 'MODERATE', water_level: '3.5 ft', pop: 220, stuck: true, resources: 'rescue_boat,food,medical', notes: 'Border-adjacent village. Entire lower ward submerged.' },
  { pincode: '143304', village: 'Kacha Pacca', severity: 'MODERATE', water_level: '3.0 ft stable', pop: 180, stuck: false, resources: 'food,clean_water,blankets,sanitation', notes: 'Low-lying farmland with labor settlements flooded.' },
  { pincode: '143305', village: 'Khalra', severity: 'SEVERE', water_level: '5.6 ft', pop: 410, stuck: true, resources: 'rescue_boat,medical,food,tents,ambulance', notes: 'Historically vulnerable riverside village. Evacuation centre capacity exceeded.' },

  // --- TARN TARAN TOWN & SURROUNDS (143401-143415) ---
  { pincode: '143401', village: 'Tarn Taran Town', severity: 'SEVERE', water_level: '5.0 ft', pop: 480, stuck: true, resources: 'rescue_boat,medical,food,tents', notes: 'District HQ flooded. Municipal drains overwhelmed. Relief camp active at gurudwara.' },
  { pincode: '143402', village: 'Police Lines Area', severity: 'MODERATE', water_level: '2.7 ft', pop: 130, stuck: false, resources: 'food,medical,clean_water', notes: 'Police lines campus partially inundated. Staff quarters affected.' },
  { pincode: '143406', village: 'Kang', severity: 'MODERATE', water_level: '3.3 ft', pop: 200, stuck: true, resources: 'food,rescue_boat,clean_water', notes: 'Canal overflow into agricultural belt and hamlet.' },
  { pincode: '143407', village: 'Fatehabad', severity: 'LOW', water_level: '1.8 ft receding', pop: 90, stuck: false, resources: 'food,clean_water', notes: 'Waterlogging near canal distributary. Receding slowly.' },
  { pincode: '143408', village: 'Chohla Sahib', severity: 'SEVERE', water_level: '4.4 ft', pop: 320, stuck: true, resources: 'rescue_boat,food,medical,blankets', notes: 'Sacred town partially submerged. Pilgrims and locals stranded.' },
  { pincode: '143409', village: 'Naushehra Pannuan', severity: 'MODERATE', water_level: '3.1 ft', pop: 175, stuck: true, resources: 'food,rescue_boat,medical', notes: 'Rural cluster cut off by floodwater on arterial road.' },
  { pincode: '143410', village: 'Sarhali', severity: 'MODERATE', water_level: '2.9 ft', pop: 160, stuck: false, resources: 'food,clean_water,blankets', notes: 'Canal breach reported 2km upstream. Monitoring situation.' },
  { pincode: '143411', village: 'Dhotian', severity: 'LOW', water_level: '1.5 ft', pop: 80, stuck: false, resources: 'food,clean_water', notes: 'Minor overflow from distributary. No immediate rescue required.' },
  { pincode: '143413', village: 'Bundala', severity: 'MODERATE', water_level: '3.6 ft', pop: 230, stuck: true, resources: 'food,rescue_boat,medical', notes: 'Panchayat road submerged. Buses not running. Need supplies.' },
  { pincode: '143415', village: 'Kairon', severity: 'SEVERE', water_level: '4.9 ft', pop: 370, stuck: true, resources: 'rescue_boat,ambulance,medical,food,tents', notes: 'Historic village on floodplain. Over 50 families on rooftops awaiting rescue.' },

  // --- GURDASPUR DISTRICT — BATALA BELT (143501-143532) ---
  { pincode: '143501', village: 'Verka', severity: 'MODERATE', water_level: '2.6 ft', pop: 155, stuck: false, resources: 'food,medical,clean_water', notes: 'Dairy cooperative area flooded. Livestock evacuation underway.' },
  { pincode: '143502', village: 'Kathunangal', severity: 'MODERATE', water_level: '3.0 ft', pop: 190, stuck: true, resources: 'food,rescue_boat,clean_water', notes: 'Rural cluster near Beas. Ferry service suspended. Supplies needed.' },
  { pincode: '143504', village: 'Chawinda Devi', severity: 'SEVERE', water_level: '4.3 ft', pop: 280, stuck: true, resources: 'rescue_boat,food,medical,tents', notes: 'Religiously significant village. Shrine precincts flooded. Evacuation ongoing.' },
  { pincode: '143505', village: 'Batala City', severity: 'SEVERE', water_level: '5.1 ft rising', pop: 520, stuck: true, resources: 'rescue_boat,medical,food,tents,ambulance', notes: 'Urban center under severe flood. Old city lanes inaccessible. Multiple relief camps.' },
  { pincode: '143511', village: 'Bhagowal', severity: 'MODERATE', water_level: '3.2 ft', pop: 165, stuck: true, resources: 'food,rescue_boat,medical', notes: 'Agricultural hamlets cut off. Tubewell motors damaged.' },
  { pincode: '143512', village: 'Kalanaur', severity: 'MODERATE', water_level: '2.8 ft', pop: 140, stuck: false, resources: 'food,clean_water,sanitation', notes: 'Sub-town flooding with open drain overflow. Health risk elevated.' },
  { pincode: '143513', village: 'Kala Afgana', severity: 'LOW', water_level: '1.4 ft', pop: 70, stuck: false, resources: 'food,clean_water', notes: 'Minor waterlogging. Access road intact.' },
  { pincode: '143516', village: 'Qadian', severity: 'MODERATE', water_level: '3.5 ft', pop: 210, stuck: true, resources: 'food,rescue_boat,medical,clean_water', notes: 'Historic town partially flooded. Heritage buildings at risk.' },
  { pincode: '143517', village: 'Bhattian', severity: 'SEVERE', water_level: '4.6 ft', pop: 290, stuck: true, resources: 'rescue_boat,food,medical,tents', notes: 'Isolated village belt. River tributary overflowed into habitation.' },
  { pincode: '143518', village: 'Naushera Majja Singh', severity: 'MODERATE', water_level: '3.1 ft', pop: 170, stuck: false, resources: 'food,clean_water,blankets', notes: 'Canal distributary overflowing into village. Fields submerged.' },
  { pincode: '143519', village: 'Dhariwal', severity: 'MODERATE', water_level: '2.9 ft', pop: 145, stuck: false, resources: 'food,medical,clean_water', notes: 'Sub-town road blocked. Basic supplies depleted.' },
  { pincode: '143520', village: 'Sohal', severity: 'LOW', water_level: '1.6 ft', pop: 85, stuck: false, resources: 'food,clean_water', notes: 'Minor inundation. Villagers managing independently.' },
  { pincode: '143521', village: 'Gurdaspur City', severity: 'SEVERE', water_level: '4.8 ft', pop: 460, stuck: true, resources: 'rescue_boat,ambulance,medical,food,tents', notes: 'District HQ facing severe flooding. Elderly population needs priority evacuation.' },
  { pincode: '143525', village: 'Marara', severity: 'MODERATE', water_level: '3.3 ft', pop: 195, stuck: true, resources: 'food,rescue_boat,blankets', notes: 'Ravi catchment area. Flood arriving from upstream Himachal catchment.' },
  { pincode: '143526', village: 'Dorangla', severity: 'MODERATE', water_level: '2.7 ft', pop: 130, stuck: false, resources: 'food,clean_water,sanitation', notes: 'Moderate waterlogging. Sanitation infrastructure compromised.' },
  { pincode: '143527', village: 'Harchowal', severity: 'SEVERE', water_level: '5.0 ft', pop: 350, stuck: true, resources: 'rescue_boat,food,medical,tents', notes: 'Sub-mountain foothills flooded from flash runoff. Multiple houses collapsed.' },
  { pincode: '143528', village: 'Kahnuwan', severity: 'MODERATE', water_level: '3.4 ft', pop: 200, stuck: true, resources: 'food,rescue_boat,medical', notes: 'Canal-side village cut off. Self-organized community shelter running low.' },
  { pincode: '143529', village: 'Tibber', severity: 'MODERATE', water_level: '3.0 ft stable', pop: 155, stuck: false, resources: 'food,clean_water,blankets', notes: 'Stable situation. Supply replenishment needed.' },
  { pincode: '143530', village: 'Tibri Cantt Area', severity: 'LOW', water_level: '1.3 ft', pop: 60, stuck: false, resources: 'food,clean_water', notes: 'Cantonment periphery. Minor flooding, army managing internal.' },
  { pincode: '143531', village: 'Dinanagar', severity: 'MODERATE', water_level: '2.8 ft', pop: 180, stuck: false, resources: 'food,medical,clean_water', notes: 'Sub-town drains clogged. Standing water causing health concerns.' },
  { pincode: '143532', village: 'Behrampur', severity: 'SEVERE', water_level: '4.5 ft', pop: 310, stuck: true, resources: 'rescue_boat,medical,food,tents', notes: 'Hill-foot town. Flash flood from Shivalik catchment. Several households submerged.' },

  // --- MAJITHA-FATEHGARH BELT (143601-143606) ---
  { pincode: '143601', village: 'Majitha Town', severity: 'MODERATE', water_level: '3.2 ft', pop: 220, stuck: true, resources: 'food,rescue_boat,medical', notes: 'Canal outfall backing up. Town low point flooded.' },
  { pincode: '143602', village: 'Fatehgarh Churian', severity: 'SEVERE', water_level: '4.7 ft', pop: 340, stuck: true, resources: 'rescue_boat,medical,food,tents,ambulance', notes: 'Border-adjacent town severely flooded. Pakistan-side drain outflows aggravating.' },
  { pincode: '143603', village: 'Ramdass', severity: 'SEVERE', water_level: '5.2 ft rising', pop: 390, stuck: true, resources: 'rescue_boat,food,medical,ambulance,tents', notes: 'Ravi riverside village. Embankment breach confirmed. Flash evacuation required.' },
  { pincode: '143604', village: 'Dera Baba Nanak', severity: 'SEVERE', water_level: '4.9 ft', pop: 430, stuck: true, resources: 'rescue_boat,medical,food,tents,ambulance', notes: 'Sacred riverfront town. Ghat area submerged. Border bridge approach flooded.' },
  { pincode: '143605', village: 'Dhianpur', severity: 'MODERATE', water_level: '3.4 ft', pop: 195, stuck: true, resources: 'food,rescue_boat,medical', notes: 'Floodplain village. Canal distributary overflow cut off access road.' },
  { pincode: '143606', village: 'Chetanpura', severity: 'MODERATE', water_level: '2.9 ft', pop: 150, stuck: false, resources: 'food,clean_water,blankets', notes: 'Rural settlement with waterlogged fields. Supply route via alternate road.' },
];

// ---------------------------------------------------------------------------
// DB wipe — truncate everything
// ---------------------------------------------------------------------------
async function wipeDatabase() {
  console.log('[seed] Wiping entire database...');

  // Order matters — children first to avoid FK violations
  await prisma.groupResourceAllocation.deleteMany();
  await prisma.groupAssignment.deleteMany();
  await prisma.groupLocation.deleteMany();
  await prisma.group.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.disasterReport.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.responderLocation.deleteMany();
  await prisma.responder.deleteMany();
  await prisma.allUsers.deleteMany();
  await prisma.user.deleteMany();
  await prisma.nGO.deleteMany();
  await prisma.government.deleteMany();
  await prisma.volunteer.deleteMany();

  console.log('[seed] Database wiped clean.');
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
async function createUser() {
  const user = await prisma.user.create({
    data: {
      email: 'aman.singh.1996@mail.com',
      full_name: 'Amanpreet Singh',
      dob: new Date('1996-04-12'),
      gender: 'male',
      phone_number: '9876501234',
      alternate_phone: '9815507788',
      current_address: '2832/2, Indra Nagar, Ludhiana',
      pincode: '141003',
      city: 'Ludhiana',
      state: 'Punjab',
      country: 'India',
      live_location_permission: true,
      home_location_lat: 30.9010,
      home_location_lng: 75.8573,
      aadhar_id: '421857309642',
      blood_group: 'B+',
      medical_conditions: 'Mild asthma',
      allergies: 'Dust allergy',
      emergency_contact_name: 'Harpreet Kaur',
      emergency_contact_relation: 'Sister',
      emergency_contact_phone: '9876508899',
      primary_language: 'Punjabi',
      secondary_language: 'Hindi',
      communication_assistance: false,
    },
  });

  const passwordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
  await prisma.allUsers.create({
    data: {
      email: user.email,
      password: passwordHash,
      user_type: 'user',
      full_name: user.full_name,
      user_id: user.id,
    },
  });

  return user;
}

// ---------------------------------------------------------------------------
// NGO + teams + inventory
// ---------------------------------------------------------------------------
async function createNgoWithTeamsAndInventory(seed) {
  const ngo = await prisma.nGO.create({
    data: {
      email: seed.email,
      ngo_name: seed.ngo_name,
      registration_number: seed.registration_number,
      ngo_type: seed.ngo_type,
      year_established: seed.year_established,
      mission_statement: seed.mission_statement,
      official_contact: seed.official_contact,
      alternate_contact: seed.alternate_contact,
      website: seed.website,
      registered_address: seed.registered_address,
      operational_areas: seed.operational_areas,
      location_lat: seed.location_lat,
      location_lng: seed.location_lng,
      admin_name: seed.admin_name,
      admin_designation: seed.admin_designation,
      admin_mobile: seed.admin_mobile,
      admin_email: seed.admin_email,
      aadhar_card: seed.aadhar_card,
      resource_types: seed.resource_types,
      team_strength: seed.team_strength,
      bank_account_number: seed.bank_account_number,
      isVerified: true,
    },
  });

  const ngoPasswordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
  const ngoAllUser = await prisma.allUsers.create({
    data: {
      email: ngo.email,
      password: ngoPasswordHash,
      user_type: 'ngo',
      full_name: seed.ngo_name,
      ngo_id: ngo.id,
    },
  });

  const responder = await prisma.responder.create({
    data: {
      ngo_id: ngo.id,
      services_provided: seed.services_provided,
      bank_account_number: ngo.bank_account_number,
      location_lat: ngo.location_lat,
      location_lng: ngo.location_lng,
      location_address: ngo.registered_address,
      isActive: true,
    },
  });

  await prisma.inventoryItem.createMany({
    data: seed.inventory.map((item) => ({
      item: item.item,
      total_quantity: item.total_quantity,
      ngo_id: ngo.id,
    })),
  });

  const inventoryItems = await prisma.inventoryItem.findMany({ where: { ngo_id: ngo.id } });
  const itemIdByName = Object.fromEntries(inventoryItems.map((i) => [i.item, i.id]));

  const teamCredentials = [];
  for (const teamSeed of seed.teams) {
    const groupPasswordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
    const group = await prisma.group.create({
      data: {
        group_name: teamSeed.name,
        username: teamSeed.username,
        email: teamSeed.email,
        password: groupPasswordHash,
        creator_type: 'ngo',
        creator_id: ngo.id,
        ngo_id: ngo.id,
        ttl_type: 'no_expiry',
        expires_at: null,
        is_active: true,
      },
    });

    for (const [itemName, qty] of teamSeed.allocations) {
      const itemId = itemIdByName[itemName];
      if (!itemId) continue;
      await prisma.groupResourceAllocation.create({
        data: { group_id: group.id, inventory_item_id: itemId, allocated_quantity: qty },
      });
    }

    await prisma.groupLocation.create({
      data: {
        group_id: group.id,
        latitude: teamSeed.latitude,
        longitude: teamSeed.longitude,
        accuracy: teamSeed.accuracy,
        status: teamSeed.status,
        battery_level: teamSeed.battery_level,
      },
    });

    teamCredentials.push({ name: teamSeed.name, email: teamSeed.email, password: DEFAULT_TEST_PASSWORD });
  }

  return { ngo, ngoAllUser, responder, teamCredentials };
}

// ---------------------------------------------------------------------------
// Incident reports — all Majha flood
// ---------------------------------------------------------------------------
async function createMajhaFloodIncidents(user, seededOrgs) {
  const responders = seededOrgs.map((o) => o.responder);
  const approver = seededOrgs[0].ngoAllUser;

  // Spread incidents across the 4 NGO responders
  let created = 0;

  for (let i = 0; i < MAJHA_FLOOD_INCIDENTS.length; i++) {
    const inc = MAJHA_FLOOD_INCIDENTS[i];
    const pincodeInfo = getPincode(inc.pincode);

    // Assign responder cycling through the 4 NGOs
    const responder = responders[i % responders.length];

    // Spread timestamps across last 6 hours
    const minutesAgo = 10 + Math.floor((i / MAJHA_FLOOD_INCIDENTS.length) * 340);
    const approvedAt = new Date(Date.now() - minutesAgo * 60 * 1000);

    // Determine status for variety
    let status = 'approved';
    if (i % 7 === 0) status = 'in_progress';

    await prisma.disasterReport.create({
      data: {
        is_sos: false,
        responder_id: responder.id,
        pincode: pincodeInfo.pincode,
        city: pincodeInfo.office.replace(/ (SO|HO|GPO).*$/, '').trim(),
        village: inc.village,
        latitude: pincodeInfo.centerLat,
        longitude: pincodeInfo.centerLng,
        severity: inc.severity,
        water_level: inc.water_level,
        affected_population: inc.pop,
        stuck_people_found: inc.stuck,
        resources_needed: inc.resources,
        notes: inc.notes,
        images: JSON.stringify([]),
        polygon: pincodeInfo.polygon,
        status,
        approved_by: approver.id,
        approved_at: approvedAt,
      },
    });

    created++;
  }

  // A couple of user-submitted SOS from Ludhiana city
  const ludhianaMain = getPincode('141003');
  const ludhianaAlt = getPincode('141003');

  await prisma.disasterReport.create({
    data: {
      is_sos: true,
      user_id: user.id,
      severity: 'SEVERE',
      pincode: ludhianaMain.pincode,
      city: 'Ludhiana',
      latitude: 30.9010,
      longitude: 75.8573,
      stuck_people_found: true,
      affected_population: 1,
      notes: 'SOS — My house is flooded to 4 feet. Elderly mother cannot move. Need immediate help.',
      status: 'pending',
      polygon: ludhianaMain.polygon,
    },
  });

  await prisma.disasterReport.create({
    data: {
      is_sos: true,
      user_id: user.id,
      severity: 'SEVERE',
      pincode: ludhianaAlt.pincode,
      city: 'Ludhiana',
      latitude: 30.9050,
      longitude: 75.8520,
      stuck_people_found: true,
      affected_population: 1,
      notes: 'SOS — Trapped on second floor. Ground floor fully submerged. Need rescue boat.',
      status: 'pending',
      polygon: ludhianaAlt.polygon,
    },
  });

  return created + 2;
}

// ---------------------------------------------------------------------------
// Main

async function main() {
  console.log('=== RICOS Enhanced Seed (NGO + Government + Volunteers + Multiple Users) ===');
  loadPincodePolygons();
  await wipeDatabase();

  // Users
  const createdUsers = await createUsers();
  console.log(`[seed] ${createdUsers.length} users created.`);

  // NGOs
  const seededNgos = [];
  for (const ngoSeed of NGO_SEEDS) {
    const seeded = await createNgoWithTeamsAndInventory(ngoSeed);
    seededNgos.push(seeded);
    console.log(`[seed] NGO created: ${ngoSeed.ngo_name}`);
  }

  // Government agencies
  const seededGovts = [];
  for (const govtSeed of GOVT_SEEDS) {
    const seeded = await createGovernmentWithTeamsAndInventory(govtSeed);
    seededGovts.push(seeded);
    console.log(`[seed] Government agency created: ${govtSeed.agency_name}`);
  }

  // Volunteers
  const seededVolunteers = [];
  for (const volSeed of VOLUNTEER_SEEDS) {
    const seeded = await createVolunteerWithTeamsAndInventory(volSeed);
    seededVolunteers.push(seeded);
    console.log(`[seed] Volunteer organization created: ${volSeed.group_name}`);
  }

  const allOrgs = [...seededNgos, ...seededGovts, ...seededVolunteers];
  const incidentCount = await createMajhaFloodIncidents(createdUsers[0], allOrgs);

  console.log('\n========== SEED COMPLETE ==========');
  console.log('');
  console.log('--- USERS ---');
  createdUsers.forEach((u) => {
    console.log(`${u.user.full_name}: ${u.user.email} / ${DEFAULT_TEST_PASSWORD}`);
  });

  console.log('');
  console.log('--- NGOs ---');
  seededNgos.forEach((org, idx) => {
    console.log(`NGO ${idx + 1}: ${org.ngo.email} / ${DEFAULT_TEST_PASSWORD}`);
    org.teamCredentials.forEach((team, teamIdx) => {
      console.log(`  Team ${idx + 1}.${teamIdx + 1}: ${team.email} / ${team.password}`);
    });
  });

  console.log('');
  console.log('--- GOVERNMENT AGENCIES ---');
  seededGovts.forEach((org, idx) => {
    console.log(`Govt ${idx + 1}: ${org.govt.email} / ${DEFAULT_TEST_PASSWORD}`);
    org.teamCredentials.forEach((team, teamIdx) => {
      console.log(`  Team ${idx + 1}.${teamIdx + 1}: ${team.email} / ${team.password}`);
    });
  });

  console.log('');
  console.log('--- VOLUNTEERS ---');
  seededVolunteers.forEach((org, idx) => {
    console.log(`Volunteer ${idx + 1}: ${org.volunteer.email} / ${DEFAULT_TEST_PASSWORD}`);
    org.teamCredentials.forEach((team, teamIdx) => {
      console.log(`  Team ${idx + 1}.${teamIdx + 1}: ${team.email} / ${team.password}`);
    });
  });

  console.log('');
  console.log('====================================');
  console.log(`Users seeded:         ${createdUsers.length}`);
  console.log(`NGOs seeded:          ${seededNgos.length}`);
  console.log(`Government agencies:  ${seededGovts.length}`);
  console.log(`Volunteers:           ${seededVolunteers.length}`);
  console.log(`Total teams:          ${seededNgos.reduce((s, o) => s + o.teamCredentials.length, 0) + seededGovts.reduce((s, o) => s + o.teamCredentials.length, 0) + seededVolunteers.reduce((s, o) => s + o.teamCredentials.length, 0)}`);
  console.log(`Incidents seeded:     ${incidentCount} (all Majha flood)`);
  console.log('====================================');
}

main()
  .catch((e) => {
    console.error('[seed] FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
