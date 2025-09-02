import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  FileText,
  List,
  Download,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isMobile } from "@/lib/utils";
import { ShareButton } from "@/components/ShareButton";
import { PodcastPlatformButtons } from "@/components/PodcastPlatformButtons";
import { RssButton } from "@/components/RssButton";
import { EventItem } from "@/lib/nip01";

interface Chapter {
  startTime: number;
  endTime: number;
  title: string;
}

interface TranscriptEntry {
  startTime: number;
  endTime?: number;
  text: string;
}

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  chaptersUrl?: string;
  transcriptUrl?: string;
  duration?: string;
  event?: EventItem;
}

export interface AudioPlayerRef {
  play: () => void;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ audioUrl, title, chaptersUrl, transcriptUrl, duration, event }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [showTranscript, setShowTranscript] = useState(false);
    const [showChapters, setShowChapters] = useState(false);
    const [syncTranscript, setSyncTranscript] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    const isMobileView = useMemo(() => isMobile(), []);
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const transcriptScrollRef = useRef<HTMLDivElement>(null);
    const transcriptScrollAreaRef = useRef<HTMLDivElement>(null);
    const [currentTranscriptEntry, setCurrentTranscriptEntry] = useState<TranscriptEntry | null>(
      null,
    );

    // Expose play method to parent component
    useImperativeHandle(ref, () => ({
      play: () => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      },
    }));

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

    // Apply playback speed when audio element is ready
    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
      }
    }, [playbackSpeed]);

    // Auto-scroll to current transcript entry when it changes
    useEffect(() => {
      if (syncTranscript && currentTranscriptEntry && transcriptScrollRef.current) {
        // Find the current transcript entry element
        const currentEntryElement = transcriptScrollRef.current.querySelector(
          `[data-transcript-text="${currentTranscriptEntry.text}"]`,
        );

        if (currentEntryElement) {
          // Find the ScrollArea viewport to scroll
          const scrollAreaViewport = transcriptScrollAreaRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]",
          );

          if (scrollAreaViewport) {
            // Check if the current entry is already visible in the viewport
            const entryRect = currentEntryElement.getBoundingClientRect();
            const viewportRect = scrollAreaViewport.getBoundingClientRect();

            const isEntryVisible =
              entryRect.top >= viewportRect.top && entryRect.bottom <= viewportRect.bottom;

            // Only scroll if the entry is not visible
            if (!isEntryVisible) {
              // Scroll so the current entry is at the bottom of the visible area
              const scrollTop =
                scrollAreaViewport.scrollTop +
                (entryRect.top - viewportRect.top) -
                viewportRect.height +
                entryRect.height;

              scrollAreaViewport.scrollTo({
                top: scrollTop,
                behavior: "smooth",
              });
            }
          }
        }
      }
    }, [currentTranscriptEntry, syncTranscript]);

    // Parse VTT format
    const parseVTT = (vttText: string): TranscriptEntry[] => {
      const lines = vttText.split("\n");
      const entries: TranscriptEntry[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and numbered entries
        if (!line || /^\d+$/.test(line)) {
          continue;
        }

        if (line.includes("-->")) {
          const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);

          if (timeMatch) {
            const startTime = parseTimeToSeconds(timeMatch[1]);
            const endTime = parseTimeToSeconds(timeMatch[2]);

            // Collect all text lines until we hit another timestamp or number
            let textLines: string[] = [];
            let j = i + 1;

            while (j < lines.length) {
              const nextLine = lines[j].trim();

              // Stop if we hit another timestamp, number, or empty line
              if (nextLine.includes("-->") || /^\d+$/.test(nextLine) || !nextLine) {
                break;
              }

              textLines.push(nextLine);
              j++;
            }

            const text = textLines.join(" ");

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

        // Update current chapter (chapters are sorted by startTime)
        if (chapters.length > 0) {
          let currentChapter = null;

          // Find the chapter where current time is >= startTime
          for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            const nextChapter = chapters[i + 1];

            // If we're within this chapter's time range
            if (current >= chapter.startTime && (!nextChapter || current < nextChapter.startTime)) {
              currentChapter = chapter;
              break;
            }
          }

          setCurrentChapter(currentChapter);
        }

        // Update current transcript entry (only if transcript is loaded)
        if (transcript.length > 0) {
          const entry = transcript.find((tr) => current >= tr.startTime && current <= tr.endTime);
          setCurrentTranscriptEntry(entry || null);
        }
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

    // Cycle through playback speeds
    const cyclePlaybackSpeed = () => {
      const speeds = [1, 1.25, 1.5, 2];
      const currentIndex = speeds.indexOf(playbackSpeed);
      const nextIndex = (currentIndex + 1) % speeds.length;
      const newSpeed = speeds[nextIndex];

      setPlaybackSpeed(newSpeed);
      if (audioRef.current) {
        audioRef.current.playbackRate = newSpeed;
      }
    };

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return; // Don't handle shortcuts when typing in input fields
        }

        switch (e.code) {
          case "Space": {
            e.preventDefault();

            togglePlay();

            break;
          }
          case "ArrowLeft": {
            e.preventDefault();

            skip(-10);

            break;
          }
          case "ArrowRight": {
            e.preventDefault();

            skip(10);

            break;
          }
          case "ArrowUp": {
            e.preventDefault();

            if (audioRef.current) {
              const newVolume = Math.min(1, volume + 0.1);

              setVolume(newVolume);

              audioRef.current.volume = newVolume;
            }

            break;
          }
          case "ArrowDown": {
            e.preventDefault();

            if (audioRef.current) {
              const newVolume = Math.max(0, volume - 0.1);

              setVolume(newVolume);

              audioRef.current.volume = newVolume;
            }

            break;
          }
          case "KeyM": {
            e.preventDefault();
            toggleMute();
            break;
          }
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
        <CardContent className="space-y-3">
          {/* Audio element */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="w-12 text-right font-mono">{formatTime(currentTime)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={cyclePlaybackSpeed}
                className="h-6 px-2 text-xs font-mono hover:text-main-accent"
              >
                {playbackSpeed}x
              </Button>
              <span className="w-12 text-left font-mono">{formatTime(durationSeconds)}</span>
            </div>
            <div
              ref={progressRef}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative border border-gray-300 dark:border-gray-600"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-150"
                style={{ width: `${(currentTime / durationSeconds) * 100}%` }}
              />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-3">
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
          <div className="flex justify-center w-full gap-2">
            <div className="relative flex items-center w-1/2">
              <div className="absolute left-[-40px] top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="sm" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5 flex-wrap items-center">
            {chapters.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowChapters(!showChapters)}
                className={`flex items-center gap-2 ${showChapters ? "bg-blue-500 dark:bg-blue-900" : ""}`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:block">Bölümler ({chapters.length})</span>
              </Button>
            )}

            {transcript.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowTranscript(!showTranscript)}
                className={`flex items-center gap-2 ${showTranscript ? "bg-blue-500 dark:bg-blue-900" : ""}`}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:block">Transkript</span>
              </Button>
            )}

            <Button asChild variant="outline" className="flex-1">
              <a href={audioUrl} download>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:block">İndir</span>
              </a>
            </Button>

            {/* Podcast platform buttons and RSS - inline with other buttons */}
            <PodcastPlatformButtons variant="ghost" size="sm" showText={false} />
            <RssButton
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200"
            />

            {/* Share button - only show if event is provided */}
            {event && <ShareButton event={event} isPodcast={true} />}
          </div>

          {/* Keyboard shortcuts help */}
          {!isMobileView && (
            <div className="text-xs text-gray-500 text-center pt-1 hidden sm:block">
              <span className="font-medium">Klavye kısayolları:</span> Space (oynat/duraklat), ←→
              (10s atla), ↑↓ (ses), M (sessiz)
            </div>
          )}

          {/* Chapters dropdown */}
          {showChapters && chapters.length > 0 && (
            <Collapsible open={showChapters} onOpenChange={setShowChapters}>
              <CollapsibleContent>
                <div className="border rounded-lg p-2 space-y-2">
                  <h4 className="font-medium text-sm text-main-accent">Bölümler</h4>

                  {/* Chapters list */}
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {/* All chapters */}
                    {chapters.map((chapter, index) => (
                      <button
                        key={index}
                        onClick={() => jumpToTime(chapter.startTime)}
                        className={`group w-full text-left p-2 rounded text-sm hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-500 dark:hover:text-white ${
                          currentChapter?.title === chapter.title
                            ? "bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-500"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`truncate ${currentChapter?.title === chapter.title ? "font-medium text-blue-700 dark:text-blue-300" : ""}`}
                          >
                            {chapter.title}
                          </span>
                          <span
                            className={`text-xs group-hover:text-gray-700 dark:group-hover:text-gray-300 ${currentChapter?.title === chapter.title ? "text-blue-600 dark:text-blue-400" : "text-gray-500"}`}
                          >
                            {formatTime(chapter.startTime)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Transcript panel */}
          {showTranscript && transcript.length > 0 && (
            <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
              <CollapsibleContent>
                <div className="border rounded-lg p-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-main-accent">Transkript</h4>
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Checkbox
                        checked={syncTranscript}
                        onCheckedChange={(checked) => setSyncTranscript(checked as boolean)}
                      />
                      Senkronize et
                    </label>
                  </div>

                  {/* Transcript list */}
                  <ScrollArea ref={transcriptScrollAreaRef} className="h-80">
                    <div ref={transcriptScrollRef} className="space-y-2">
                      {/* All transcript entries */}
                      {transcript.map((entry, index) => (
                        <div
                          key={index}
                          data-transcript-text={entry.text}
                          onClick={() => jumpToTime(entry.startTime)}
                          className={`group p-2 rounded cursor-pointer hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-500 dark:hover:text-white ${
                            syncTranscript && currentTranscriptEntry?.text === entry.text
                              ? "bg-green-100 dark:bg-green-900/30 border-l-4 border-l-green-500 text-gray-700 dark:text-gray-500"
                              : ""
                          }`}
                          title={`${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-sm leading-relaxed">{entry.text}</span>
                            <span className="text-xs text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 whitespace-nowrap">
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
  },
);

AudioPlayer.displayName = "AudioPlayer";

export default AudioPlayer;
