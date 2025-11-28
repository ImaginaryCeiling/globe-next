'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { Person } from '../types/schema';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  people: Person[];
  onPersonClick: (person: Person) => void;
}

export default function Map({ people, onPersonClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Request user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to default location (San Francisco)
          setUserLocation([-122.4194, 37.7749]);
        }
      );
    } else {
      setUserLocation([-122.4194, 37.7749]);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !userLocation || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'background',
            paint: {
              'background-color': '#000000',
            },
          },
          {
            id: 'carto-tiles',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: userLocation,
      zoom: 11,
    });

    // Add user location marker
    const el = document.createElement('div');
    el.className = 'user-location-marker';

    const pulse = document.createElement('div');
    pulse.className = 'user-location-pulse';

    const dot = document.createElement('div');
    dot.className = 'user-location-dot';

    el.appendChild(pulse);
    el.appendChild(dot);

    new maplibregl.Marker({ element: el })
      .setLngLat(userLocation)
      .addTo(map.current);

    map.current.on('load', () => {
      // Add a new source from our GeoJSON data
      map.current?.addSource('people', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Clusters: Color circles
      map.current?.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'people',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#ef4444', // red-500
            5,
            '#f59e0b', // amber-500
            20,
            '#10b981'  // emerald-500
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            5,
            30,
            20,
            40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Cluster Counts: Text
      map.current?.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'people',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Arial Unicode MS Bold', 'Arial Bold'],
          'text-size': 14,
          'text-allow-overlap': true
        },
        paint: {
            'text-color': '#ffffff'
        }
      });

      // Unclustered Points: Individual people
      map.current?.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'people',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#ef4444', // red-500
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // inspect a cluster on click
      map.current?.on('click', 'clusters', async (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        const clusterId = features?.[0]?.properties?.cluster_id;
        
        const source = map.current?.getSource('people') as maplibregl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
            map.current?.easeTo({
                center: (features?.[0]?.geometry as any).coordinates,
                zoom: zoom || 14
            });
        }).catch(err => console.error(err));
      });

      // Handle click on individual person
      map.current?.on('click', 'unclustered-point', (e) => {
          if (!e.features || !e.features[0]) return;
          
          const props = e.features[0].properties;
          const personId = props?.id;
          const clickedPerson = people.find(p => p.id === personId);

          if (clickedPerson) {
            onPersonClick(clickedPerson);
          }
      });

      // Cursor pointer
      map.current?.on('mouseenter', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current?.on('mouseleave', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
      });
      map.current?.on('mouseenter', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current?.on('mouseleave', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
    });

      updateSourceData();
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [userLocation]);

  // Helper to update GeoJSON data
  const updateSourceData = () => {
      if (!map.current || !map.current.getSource('people')) return;

      const features = people.map(p => ({
          type: 'Feature',
          geometry: {
              type: 'Point',
              coordinates: [p.current_location_lng, p.current_location_lat]
          },
          properties: {
              id: p.id,
              name: p.name
          }
      }));

      const source = map.current.getSource('people') as maplibregl.GeoJSONSource;
      source.setData({
          type: 'FeatureCollection',
          features: features as any
      });
  };

  // Watch for people changes
  useEffect(() => {
      updateSourceData();
  }, [people]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full relative" 
    />
  );
}
