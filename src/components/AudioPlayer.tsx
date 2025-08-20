import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Clock,
  FileText,
  List,
  Download,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Chapter {
  startTime: number;
  endTime: number;
  title: string;
}

interface TranscriptEntry {
  startTime: number;
  endTime: number;
  text: string;
}

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  chaptersUrl?: string;
  transcriptUrl?: string;
  duration?: string;
}

export default function AudioPlayer({
  audioUrl,
  title,
  chaptersUrl,
  transcriptUrl,
  duration,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentTranscriptEntry, setCurrentTranscriptEntry] = useState<TranscriptEntry | null>(
    null,
  );

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Parse duration string to seconds (e.g., "1:23:45" -> 5025)
  const parseDurationString = (durationStr: string): number => {
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Load chapters if available
  useEffect(() => {
    if (chaptersUrl) {
      fetch(chaptersUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data.chapters) {
            setChapters(data.chapters);
          }
        })
        .catch((error) => console.error("Error loading chapters:", error));
    }
  }, [chaptersUrl]);

  // Load transcript if available
  useEffect(() => {
    if (transcriptUrl) {
      fetch(transcriptUrl)
        .then((response) => response.text())
        .then((text) => {
          const entries = parseVTT(text);
          setTranscript(entries);
        })
        .catch((error) => console.error("Error loading transcript:", error));
    }
  }, [transcriptUrl]);

  // Set duration from prop if available
  useEffect(() => {
    if (duration && !durationSeconds) {
      setDurationSeconds(parseDurationString(duration));
    }
  }, [duration, durationSeconds]);

  // Parse VTT format
  const parseVTT = (vttText: string): TranscriptEntry[] => {
    const lines = vttText.split("\n");
    const entries: TranscriptEntry[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes("-->")) {
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timeMatch) {
          const startTime = parseTimeToSeconds(timeMatch[1]);
          const endTime = parseTimeToSeconds(timeMatch[2]);
          const text = lines[i + 1]?.trim() || "";

          if (text) {
            entries.push({ startTime, endTime, text });
          }
        }
      }
    }

    return entries;
  };

  // Parse time string to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    const [hours, minutes, seconds] = timeStr.split(":");
    const [secs, ms] = seconds.split(".");
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + parseInt(ms) / 1000;
  };

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);

      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  };

  // Handle play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setCurrentTime(current);

      // Update current chapter
      const chapter = chapters.find((ch) => current >= ch.startTime && current <= ch.endTime);
      setCurrentChapter(chapter || null);

      // Update current transcript entry
      const entry = transcript.find((tr) => current >= tr.startTime && current <= tr.endTime);
      setCurrentTranscriptEntry(entry || null);
    }
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (audioDuration && !isNaN(audioDuration)) {
        setDurationSeconds(audioDuration);
      } else if (duration) {
        // Fallback to duration prop if audio metadata is not available
        setDurationSeconds(parseDurationString(duration));
      }
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickTime = (clickX / width) * durationSeconds;
      audioRef.current.currentTime = clickTime;
    }
  };

  // Jump to specific time
  const jumpToTime = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing in input fields
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (audioRef.current) {
            const newVolume = Math.min(1, volume + 0.1);
            setVolume(newVolume);
            audioRef.current.volume = newVolume;
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (audioRef.current) {
            const newVolume = Math.max(0, volume - 0.1);
            setVolume(newVolume);
            audioRef.current.volume = newVolume;
          }
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [volume, isMuted]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(durationSeconds)}</span>
          </div>
          <div
            ref={progressRef}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-150"
              style={{ width: `${(currentTime / durationSeconds) * 100}%` }}
            />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => skip(-10)}
            className="flex items-center gap-1"
          >
            <SkipBack className="h-4 w-4" />
            10s
          </Button>

          <Button onClick={togglePlay} size="lg" className="w-16 h-16 rounded-full">
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => skip(10)}
            className="flex items-center gap-1"
          >
            <SkipForward className="h-4 w-4" />
            10s
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {chapters.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowChapters(!showChapters)}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Bölümler ({chapters.length})
            </Button>
          )}

          {transcript.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Transcript
            </Button>
          )}

          <Button asChild variant="outline" className="flex-1">
            <a href={audioUrl} download>
              <Download className="h-4 w-4 mr-2" />
              İndir
            </a>
          </Button>
        </div>

        {/* Keyboard shortcuts help */}
        <div className="text-xs text-gray-500 text-center">
          <span className="font-medium">Klavye kısayolları:</span> Space (oynat/duraklat), ←→ (10s
          atla), ↑↓ (ses), M (sessiz)
        </div>

        {/* Current chapter and transcript indicator */}
        {(currentChapter || currentTranscriptEntry) && (
          <div className="space-y-2">
            {currentChapter && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Şu anki bölüm:</span>
                  <Badge variant="secondary">{currentChapter.title}</Badge>
                </div>
              </div>
            )}

            {currentTranscriptEntry && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">Şu anki transcript:</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {currentTranscriptEntry.text}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chapters dropdown */}
        {showChapters && chapters.length > 0 && (
          <Collapsible open={showChapters} onOpenChange={setShowChapters}>
            <CollapsibleContent>
              <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Bölümler</h4>
                {chapters.map((chapter, index) => (
                  <button
                    key={index}
                    onClick={() => jumpToTime(chapter.startTime)}
                    className={`w-full text-left p-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      currentChapter?.title === chapter.title
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate">{chapter.title}</span>
                      <span className="text-gray-500 text-xs">{formatTime(chapter.startTime)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Transcript panel */}
        {showTranscript && transcript.length > 0 && (
          <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
            <CollapsibleContent>
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Transcript
                </h4>
                <ScrollArea className="h-60">
                  <div className="space-y-2">
                    {transcript.map((entry, index) => (
                      <div
                        key={index}
                        onClick={() => jumpToTime(entry.startTime)}
                        className={`p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                          currentTranscriptEntry?.text === entry.text
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : ""
                        }`}
                        title={`${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm leading-relaxed">{entry.text}</span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTime(entry.startTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
