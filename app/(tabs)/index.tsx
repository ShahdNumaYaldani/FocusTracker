import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Pressable, Text, View } from "react-native";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const DEFAULT_MINUTES = 25;

const CATEGORIES = ["Ders Çalışma", "Kodlama", "Proje", "Kitap Okuma"] as const;
type Category = (typeof CATEGORIES)[number];

export default function TimerScreen() {
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [distractions, setDistractions] = useState(0);

  const [category, setCategory] = useState<Category>("Ders Çalışma");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionSavedRef = useRef(false);

  const showSummary = (focusedSeconds: number) => {
    Alert.alert(
      "Session Summary",
      `Süre: ${formatTime(focusedSeconds)}\nKategori: ${category}\nDikkat Dağınıklığı: ${distractions}`,
      [{ text: "OK" }]
    );
  };

  const saveSession = async (endSecondsLeft: number, forcedDistractions?: number) => {
    if (sessionSavedRef.current) return;
  
    const focusedSeconds = minutes * 60 - endSecondsLeft;
    if (focusedSeconds <= 0) return;
  
    sessionSavedRef.current = true;
  
    const session = {
      date: new Date().toISOString(),
      focusedSeconds,
      distractions: forcedDistractions ?? distractions,
      category,
    };
  
    const existing = await AsyncStorage.getItem("sessions");
    const sessions = existing ? JSON.parse(existing) : [];
    sessions.push(session);
  
    await AsyncStorage.setItem("sessions", JSON.stringify(sessions));
  
    showSummary(focusedSeconds);
  };
  

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          saveSession(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (isRunning && state === "background") {
        const newDistractions = distractions + 1;
  
        setDistractions(newDistractions);
        setIsRunning(false);
  
        saveSession(secondsLeft, newDistractions);
      }
    });
  
    return () => subscription.remove();
  }, [isRunning, secondsLeft, category, minutes, distractions]);
  
  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(minutes * 60);
      setDistractions(0);
      sessionSavedRef.current = false;
    }
  }, [minutes]);

  const Button = ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 12,
        backgroundColor: disabled ? "#999" : "#111",
        opacity: disabled ? 0.6 : 1,
        minWidth: 90,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        gap: 18,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Timer</Text>

      <Text style={{ fontSize: 56, fontVariant: ["tabular-nums"] }}>
        {formatTime(secondsLeft)}
      </Text>

      {/* Category Selection before Start */}
      <Text style={{ fontSize: 16, fontWeight: "600" }}>Category</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              disabled={isRunning}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: active ? "#111" : "#eee",
                opacity: isRunning ? 0.6 : 1,
              }}
            >
              <Text style={{ color: active ? "white" : "#111", fontWeight: "700" }}>{c}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          onPress={() => setMinutes((m) => Math.max(5, m - 5))}
          disabled={isRunning}
          style={{
            padding: 10,
            borderRadius: 10,
            backgroundColor: isRunning ? "#ccc" : "#111",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>-5</Text>
        </Pressable>

        <Text style={{ fontSize: 18, fontWeight: "700" }}>{minutes} min</Text>

        <Pressable
          onPress={() => setMinutes((m) => Math.min(60, m + 5))}
          disabled={isRunning}
          style={{
            padding: 10,
            borderRadius: 10,
            backgroundColor: isRunning ? "#ccc" : "#111",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>+5</Text>
        </Pressable>

        <Pressable
          onPress={() => setMinutes(DEFAULT_MINUTES)}
          disabled={isRunning}
          style={{
            padding: 10,
            borderRadius: 10,
            backgroundColor: isRunning ? "#ccc" : "#666",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>25</Text>
        </Pressable>
      </View>

      <Text style={{ fontSize: 16 }}>Distractions: {distractions}</Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button
          label="Start"
          onPress={() => {
            sessionSavedRef.current = false;
            setIsRunning(true);
          }}
          disabled={isRunning || secondsLeft === 0}
        />
        <Button
          label="Pause"
          onPress={() => {
            setIsRunning(false);
            saveSession(secondsLeft); 
          }}
          disabled={!isRunning}
        />
        <Button
          label="Reset"
          onPress={() => {
            setIsRunning(false);
            setSecondsLeft(minutes * 60);
            setDistractions(0);
            sessionSavedRef.current = false;
          }}
        />
      </View>
    </View>
  );
}
