import AsyncStorage from "@react-native-async-storage/async-storage";

const BarChartAny = BarChart as any;
const PieChartAny = PieChart as any;

import { BarChart, PieChart } from "react-native-chart-kit";


import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

type Session = {
  date: string;
  focusedSeconds: number;
  distractions: number;
  category?: string; 
};



function formatSecs(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function ReportsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);

  const load = async () => {
    const raw = await AsyncStorage.getItem("sessions");
    const list: Session[] = raw ? JSON.parse(raw) : [];
    // الأحدث فوق
    setSessions(list.slice().reverse());
  };

  const clearAll = async () => {
    await AsyncStorage.removeItem("sessions");
    setSessions([]);
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const now = new Date();
    const todayFocus = sessions
      .filter((s) => sameDay(new Date(s.date), now))
      .reduce((sum, s) => sum + (s.focusedSeconds || 0), 0);

    const allFocus = sessions.reduce((sum, s) => sum + (s.focusedSeconds || 0), 0);
    const allDistractions = sessions.reduce(
      (sum, s) => sum + (s.distractions || 0),
      0
    );

    return { todayFocus, allFocus, allDistractions };
  }, [sessions]);

  const barData = useMemo(() => {
    const now = new Date();
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }

    const labels = days.map((d) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
    );

    const values = days.map((day) => {
      const sum = sessions
        .filter((s) => sameDay(new Date(s.date), day))
        .reduce((acc, s) => acc + (s.focusedSeconds || 0), 0);
      return Math.round(sum / 60);
    });

    return { labels, values };
  }, [sessions]);

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const cat = (s.category || "General").trim() || "General";
      map[cat] = (map[cat] || 0) + (s.focusedSeconds || 0);
    });

    const entries = Object.entries(map)
      .map(([name, secs]) => ({
        name,
        secs,
      }))
      .filter((x) => x.secs > 0)
      .sort((a, b) => b.secs - a.secs)
      .slice(0, 6); 

    
    if (entries.length === 0) return [];

    return entries.map((e, idx) => ({
      name: e.name,
      population: Math.round(e.secs / 60), 
      color: ["#111", "#444", "#777", "#999", "#bbb", "#ddd"][idx % 6],
      legendFontColor: "#111",
      legendFontSize: 12,
    }));
  }, [sessions]);

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - 32, 380);

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(17, 17, 17, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(17, 17, 17, ${opacity})`,
    propsForBackgroundLines: {
      stroke: "#e5e5e5",
    },
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 25, fontWeight: "700" }}>Reports</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={load}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: "#111",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Refresh</Text>
            </Pressable>

            <Pressable
              onPress={clearAll}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: "#999",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Clear</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 12, gap: 6 }}>
          <Text style={{ color: "#222" }}>
            Today focus: <Text style={{ fontWeight: "700" }}>{formatSecs(totals.todayFocus)}</Text>
          </Text>
          <Text style={{ color: "#222" }}>
            All time focus: <Text style={{ fontWeight: "700" }}>{formatSecs(totals.allFocus)}</Text>
          </Text>
          <Text style={{ color: "#222" }}>
            Total distractions: <Text style={{ fontWeight: "700" }}>{totals.allDistractions}</Text>
          </Text>
          <Text style={{ color: "#444", marginTop: 4 }}>
            Sessions saved: {sessions.length}
          </Text>
        </View>

        <ScrollView style={{ marginTop: 14 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
            Last 7 days (minutes)
          </Text>
          <BarChartAny
            data={{
              labels: barData.labels,
              datasets: [{ data: barData.values }],
            }}
            width={chartWidth}
            height={220}
            fromZero
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#eee",
              paddingRight: 12,
              marginBottom: 18,
            }}
          />

<Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
  Focus by category (minutes)
</Text>

{pieData.length === 0 ? (
  <Text style={{ color: "#666", marginBottom: 18 }}>
    No category data yet.
  </Text>
) : (
  <>
    <PieChartAny
      data={pieData}
      width={chartWidth}
      height={140}          
      chartConfig={chartConfig}
      accessor={"population"}
      backgroundColor={"transparent"}
      paddingLeft={"18"}
      hasLegend={false}     
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        marginBottom: 10,
      }}
    />

    <View style={{ gap: 8, marginBottom: 18 }}>
      {(() => {
        const total = pieData.reduce((a, x) => a + (x.population || 0), 0) || 1;
        return pieData.map((x) => {
          const pct = Math.round((x.population / total) * 100);
          return (
            <View key={x.name} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: x.color,
                }}
              />
              <Text style={{ color: "#111" }}>{pct}% {x.name}</Text>
            </View>
          );
        });
      })()}
    </View>
  </>
)}


          {/* Sessions list */}
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
            Sessions
          </Text>

          {sessions.length === 0 ? (
            <Text style={{ color: "#666", marginTop: 10, marginBottom: 40 }}>
              No sessions yet. Go to Timer → Start → Pause ثم ارجعي هون واضغطي Refresh.
            </Text>
          ) : (
            sessions.map((s, idx) => (
              <View
                key={`${s.date}-${idx}`}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontWeight: "700" }}>
                  Focused: {formatSecs(s.focusedSeconds)}
                </Text>
                <Text>Distractions: {s.distractions}</Text>
                <Text>Category: {s.category || "General"}</Text>
                <Text style={{ color: "#666", marginTop: 4 }}>
                  {new Date(s.date).toLocaleString()}
                </Text>
              </View>
            ))
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
