"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveTheoryTime } from "@/hooks/use-live-theory-time";
import { TheoryContent } from "@/lib/theory-content";
import { MODULE_THEORY_REQUIRED_SEC } from "@/lib/transport";
import { formatDurationLiveRu, formatDurationRu } from "@/lib/time-tracking";
import "./module-theory-course.css";

type Material = { id: string; title: string; content: string; order: number };

function visitedStorageKey(moduleId: string) {
  return `module-theory-visited-${moduleId}`;
}

function loadVisited(moduleId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(visitedStorageKey(moduleId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveVisited(moduleId: string, ids: Set<string>) {
  localStorage.setItem(visitedStorageKey(moduleId), JSON.stringify([...ids]));
}

export function ModuleTheoryCourse({
  moduleId,
  categoryOrder,
  moduleOrder,
  moduleTitle,
  materials,
  completedTheoryTimeSec,
  activeSessionStartedAt,
}: {
  moduleId: string;
  categoryOrder: number;
  moduleOrder: number;
  moduleTitle: string;
  materials: Material[];
  completedTheoryTimeSec: number;
  activeSessionStartedAt: string | null;
}) {
  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => a.order - b.order),
    [materials],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  const liveTheoryTimeSec = useLiveTheoryTime(
    completedTheoryTimeSec,
    activeSessionStartedAt,
  );
  const theoryReady = liveTheoryTimeSec >= MODULE_THEORY_REQUIRED_SEC;
  const activeMaterial = sortedMaterials[activeIndex] ?? null;
  const progressPct =
    sortedMaterials.length > 0
      ? Math.round(((activeIndex + 1) / sortedMaterials.length) * 100)
      : 0;

  useEffect(() => {
    setVisited(loadVisited(moduleId));
  }, [moduleId]);

  const markVisited = useCallback(
    (materialId: string) => {
      setVisited((prev) => {
        if (prev.has(materialId)) return prev;
        const next = new Set(prev);
        next.add(materialId);
        saveVisited(moduleId, next);
        return next;
      });
    },
    [moduleId],
  );

  useEffect(() => {
    if (activeMaterial) markVisited(activeMaterial.id);
  }, [activeMaterial, markVisited]);

  function goTo(index: number) {
    if (index < 0 || index >= sortedMaterials.length) return;
    setActiveIndex(index);
  }

  if (sortedMaterials.length === 0) {
    return (
      <div className="theory-course">
        <div className="theory-course-empty">
          Теория для этого модуля пока не добавлена.
        </div>
      </div>
    );
  }

  return (
    <div className="theory-course">
      <div className="theory-course-top">
        <div className="theory-course-top-meta">
          <div className="theory-course-module-label">
            Категория {categoryOrder} · Модуль {moduleOrder}
          </div>
          <div className="theory-course-module-title">{moduleTitle}</div>
        </div>
        <div className="theory-course-timer">
          <div className="theory-course-timer-label">Время на теории</div>
          <div
            className={`theory-course-timer-value${theoryReady ? " is-ready" : ""}`}
          >
            {formatDurationLiveRu(liveTheoryTimeSec)} /{" "}
            {formatDurationRu(MODULE_THEORY_REQUIRED_SEC)}
            {theoryReady ? " ✓" : ""}
          </div>
        </div>
      </div>

      <div className="theory-course-progress-track" aria-hidden>
        <div
          className="theory-course-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="theory-course-body">
        <aside className="theory-course-sidebar">
          <div className="theory-course-sidebar-head">Содержание</div>
          <nav className="theory-course-nav" aria-label="Темы модуля">
            {sortedMaterials.map((material, index) => {
              const isActive = index === activeIndex;
              const isVisited = visited.has(material.id);
              return (
                <button
                  key={material.id}
                  type="button"
                  className={`theory-course-nav-item${isActive ? " is-active" : ""}${isVisited ? " is-visited" : ""}`}
                  onClick={() => goTo(index)}
                >
                  <span className="theory-course-nav-index">
                    {isVisited && !isActive ? "✓" : index + 1}
                  </span>
                  <span className="theory-course-nav-title">{material.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="theory-course-main">
          <div className="theory-course-mobile-picker">
            <select
              value={activeIndex}
              onChange={(event) => goTo(Number(event.target.value))}
              aria-label="Выбор темы"
            >
              {sortedMaterials.map((material, index) => (
                <option key={material.id} value={index}>
                  {material.title}
                </option>
              ))}
            </select>
          </div>

          {activeMaterial ? (
            <>
              <div className="theory-course-content-wrap">
                <h3 className="theory-course-section-title">
                  {activeMaterial.title}
                </h3>
                <TheoryContent content={activeMaterial.content} />
              </div>

              <div className="theory-course-footer">
                <div className="theory-course-footer-meta">
                  Тема {activeIndex + 1} из {sortedMaterials.length}
                </div>
                <div className="theory-course-footer-actions">
                  <button
                    type="button"
                    className="theory-course-btn theory-course-btn-secondary"
                    disabled={activeIndex === 0}
                    onClick={() => goTo(activeIndex - 1)}
                  >
                    ← Назад
                  </button>
                  <button
                    type="button"
                    className="theory-course-btn theory-course-btn-primary"
                    disabled={activeIndex >= sortedMaterials.length - 1}
                    onClick={() => goTo(activeIndex + 1)}
                  >
                    Далее →
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
