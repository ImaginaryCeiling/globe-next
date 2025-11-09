'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { Deck } from '@deck.gl/core';
import { ScreenGridLayer } from '@deck.gl/aggregation-layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Profile } from '../types/profile';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  profiles: Profile[];
  onCellClick: (profiles: Profile[]) => void;
}

export default function Map({ profiles, onCellClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const deckOverlay = useRef<MapboxOverlay | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Function to update layers
  const updateLayers = useCallback(() => {
    if (!deckOverlay.current || !profiles.length) {
      console.log('Cannot update layers - overlay:', !!deckOverlay.current, 'profiles:', profiles.length);
      return;
    }

    const data = profiles.map((profile) => ({
      position: [profile.location[1], profile.location[0]], // [lng, lat]
      profile,
    }));

    console.log('Rendering ScreenGridLayer with data:', data);

    const layers = [
      new ScreenGridLayer({
        id: 'screen-grid-layer',
        data,
        pickable: true,
        opacity: 0.9,
        cellSizePixels: 80,
        colorRange: [
          [0, 255, 0, 255],       // Green
          [255, 255, 0, 255],     // Yellow
          [255, 165, 0, 255],     // Orange
          [255, 69, 0, 255],      // Red-Orange
          [255, 0, 0, 255],       // Red
        ],
        getPosition: (d: any) => d.position,
        getWeight: (d: any) => 5,
        gpuAggregation: true,
        onClick: (info: any) => {
          console.log('Clicked cell:', info);
          if (info.object) {
            const cellProfiles = info.object.points?.map((p: any) => p.source.profile) || [];
            onCellClick(cellProfiles);
          }
        },
      }),
    ];

    console.log('Setting layers on deck overlay');
    deckOverlay.current.setProps({ layers });
  }, [profiles, onCellClick]);

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
      // Fallback if geolocation not supported
      setUserLocation([-122.4194, 37.7749]);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !userLocation || map.current) return;

    console.log('Initializing map at location:', userLocation);

    // Initialize MapLibre with dark theme
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
      zoom: 13,
    });

    // Wait for map to load before adding overlay
    map.current.on('load', () => {
      console.log('Map loaded, initializing deck.gl overlay');

      // Initialize deck.gl overlay
      deckOverlay.current = new MapboxOverlay({
        interleaved: true,
        layers: [],
      });

      map.current?.addControl(deckOverlay.current as any);

      // If profiles are already loaded, render them now
      if (profiles.length > 0) {
        console.log('Profiles already loaded, rendering now');
        updateLayers();
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [userLocation]);

  // Update deck.gl layers when profiles change
  useEffect(() => {
    updateLayers();
  }, [updateLayers]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-screen"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
