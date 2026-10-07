"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { heartbeatModuleSessionAction } from "@/actions/client/learning";
import { useLiveTheoryTime } from "@/hooks/use-live-theory-time";
import { TheoryContent } from "@/lib/theory-content";
import { moduleUnitLabel, programBadge, type ProgramLike } from "@/lib/program";
import { HEARTBEAT_INTERVAL_SEC } from "@/lib/transport";
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
  sessionId,
  program,
  moduleOrder,
  requiredTheorySec,
  moduleTitle,
  materials,
  completedTheoryTimeSec,
}: {
  moduleId: string;
  sessionId: string;
  program: ProgramLike;
  moduleOrder: number;
  requiredTheorySec: number;
  moduleTitle: string;
  materials: Material[];
  completedTheoryTimeSec: number;
}) {
  const router = useRouter();

  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => a.order - b.order),
    [materials],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  const liveTheoryTimeSec = useLiveTheoryTime(completedTheoryTimeSec);

  // Heartbeat: каждые 30с отправляем, сколько секунд вкладка была видна с прошлого раза.
  // Сервер засчитывает не больше реально прошедшего времени.
  useEffect(() => {
    let visibleMs = 0;
    let visibleSince = document.visibilityState === "visible" ? Date.now() : null;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (visibleSince !== null) visibleMs += Date.now() - visibleSince;
        visibleSince = null;
      } else if (visibleSince === null) {
        visibleSince = Date.now();
      }
    };

    const id = window.setInterval(async () => {
      const now = Date.now();
      const visibleSec = Math.round((visibleMs + (visibleSince !== null ? now - visibleSince : 0)) / 1000);
      visibleMs = 0;
      if (visibleSince !== null) visibleSince = now;
      await heartbeatModuleSessionAction(sessionId, visibleSec);
      if (document.visibilityState === "visible") router.refresh();
    }, HEARTBEAT_INTERVAL_SEC * 1000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [sessionId, router]);
  const theoryReady = liveTheoryTimeSec >= requiredTheorySec;
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
            {programBadge(program)} · {moduleUnitLabel(program, moduleOrder)}
          </div>
          <div className="theory-course-module-title">{moduleTitle}</div>
        </div>
        <div className="theory-course-timer">
          <div className="theory-course-timer-label">Время на теории</div>
          <div
            className={`theory-course-timer-value${theoryReady ? " is-ready" : ""}`}
          >
            {formatDurationLiveRu(liveTheoryTimeSec)}
            {requiredTheorySec > 0 ? ` / ${formatDurationRu(requiredTheorySec)}` : ""}
            {requiredTheorySec > 0 && theoryReady ? " ✓" : ""}
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
