// Modern-only code (Compose / SwiftUI) shown in the explainer, keyed by trace-step cid.
// Snippets are illustrative: short, focused on the one idea, not full apps.

export interface Snippet {
  lang: 'kotlin' | 'swift' | 'markup'
  code: string
}

const S: Record<string, Snippet[]> = {
  process: [
    {
      lang: 'kotlin',
      code: `class App : Application() {
    override fun onCreate() {
        super.onCreate() // runs before any Activity — keep it fast
    }
}

// Observe the whole app going to foreground / background:
ProcessLifecycleOwner.get().lifecycle.addObserver(
    LifecycleEventObserver { _, event -> Log.d("App", "process: $event") }
)`,
    },
  ],
  activity: [
    {
      lang: 'kotlin',
      code: `class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AppTheme { AppNavHost() } // the whole UI is composables
        }
    }
}`,
    },
  ],
  lifecycleEffects: [
    {
      lang: 'kotlin',
      code: `@Composable
fun HomeScreen(player: Player) {
    LifecycleStartEffect(Unit) {
        val updates = startLocationUpdates()   // ON_START
        onStopOrDispose { updates.cancel() }   // ON_STOP or leaving
    }
    LifecycleResumeEffect(player) {
        player.play()                          // ON_RESUME
        onPauseOrDispose { player.pause() }    // ON_PAUSE or leaving
    }
}`,
    },
  ],
  composition: [
    {
      lang: 'kotlin',
      code: `@Composable
fun HomeScreen() {
    var a by remember { mutableIntStateOf(0) }         // reset when leaving composition
    var b by rememberSaveable { mutableIntStateOf(0) } // saved in the instance-state Bundle

    DisposableEffect(Unit) {
        Log.d("Home", "entered composition")
        onDispose { Log.d("Home", "left composition") }
    }
}`,
    },
  ],
  saveState: [
    {
      lang: 'kotlin',
      code: `class CounterViewModel(private val handle: SavedStateHandle) : ViewModel() {
    // ViewModel → survives rotation. SavedStateHandle → also survives process death.
    val count = handle.getStateFlow("count", 0)
    fun increment() { handle["count"] = count.value + 1 }
}

@Composable
fun Counter(vm: CounterViewModel = viewModel()) {
    val count by vm.count.collectAsStateWithLifecycle()
    Button(onClick = vm::increment) { Text("$count") }
}`,
    },
  ],
  config: [
    {
      lang: 'markup',
      code: `<!-- AndroidManifest.xml: opt out of recreation for these changes -->
<activity
    android:name=".MainActivity"
    android:configChanges="orientation|screenSize|smallestScreenSize|screenLayout" />`,
    },
    {
      lang: 'kotlin',
      code: `@Composable
fun AdaptiveScreen() {
    val config = LocalConfiguration.current // recomposes when it changes
    val windowSize = currentWindowAdaptiveInfo().windowSizeClass
}`,
    },
  ],
  folding: [
    {
      lang: 'kotlin',
      code: `@Composable
fun rememberFold(activity: Activity): FoldingFeature? {
    val info by WindowInfoTracker.getOrCreate(activity)
        .windowLayoutInfo(activity)
        .collectAsStateWithLifecycle(null)
    return info?.displayFeatures?.filterIsInstance<FoldingFeature>()?.firstOrNull()
}

val fold = rememberFold(activity)
val tabletop = fold?.state == FoldingFeature.State.HALF_OPENED &&
    fold.orientation == FoldingFeature.Orientation.HORIZONTAL`,
    },
  ],
  recompose: [
    {
      lang: 'kotlin',
      code: `@Composable
fun Counter() {
    var count by rememberSaveable { mutableIntStateOf(0) }
    // Clicking changes state → only composables that read \`count\` re-run.
    Button(onClick = { count++ }) { Text("Count: $count") }
}`,
    },
  ],
  navigation: [
    {
      lang: 'kotlin',
      code: `@Serializable object Home
@Serializable object Detail

NavHost(navController, startDestination = Home) {
    // Each destination is a NavBackStackEntry with its own Lifecycle & ViewModelStore
    composable<Home> { HomeScreen(onOpen = { navController.navigate(Detail) }) }
    composable<Detail> { DetailScreen() }
}`,
    },
  ],
  swApp: [
    {
      lang: 'swift',
      code: `@main
struct CounterApp: App {
    @UIApplicationDelegateAdaptor private var delegate: AppDelegate

    var body: some Scene {
        WindowGroup { ContentView() } // one scene per window
    }
}`,
    },
  ],
  scenePhase: [
    {
      lang: 'swift',
      code: `struct ContentView: View {
    @Environment(\\.scenePhase) private var scenePhase

    var body: some View {
        HomeView()
            .onChange(of: scenePhase) { _, phase in
                switch phase {
                case .active:     resumeWork()
                case .inactive:   pauseWork()
                case .background: saveState()
                @unknown default: break
                }
            }
    }
}`,
    },
  ],
  appear: [
    {
      lang: 'swift',
      code: `struct HomeView: View {
    @State private var model = HomeModel()

    var body: some View {
        List(model.items) { ItemRow($0) }
            .onAppear { print("entered hierarchy") } // NOT on return from background
            .onDisappear { print("left hierarchy") }
            .task { await model.load() }              // cancelled on disappear
    }
}`,
    },
  ],
  state: [
    {
      lang: 'swift',
      code: `struct HomeView: View {
    @State private var count = 0                     // lives as long as the view
    @SceneStorage("count") private var restored = 0  // restored after the system kills the app
    @AppStorage("count") private var persisted = 0   // UserDefaults, on disk

    var body: some View {
        Button("Count: \\(count)") { count += 1; restored += 1; persisted += 1 }
    }
}`,
    },
  ],
  background: [
    {
      lang: 'swift',
      code: `// Ask for a little more time when going to the background
let id = UIApplication.shared.beginBackgroundTask {
    // time's up — clean up
}
saveToDisk()
UIApplication.shared.endBackgroundTask(id)`,
    },
  ],
  size: [
    {
      lang: 'swift',
      code: `struct HomeView: View {
    @Environment(\\.horizontalSizeClass) private var sizeClass

    var body: some View {
        if sizeClass == .regular {
            TwoColumnLayout()   // e.g. iPhone Duo inner display, iPad
        } else {
            SingleColumnLayout()
        }
    }
}`,
    },
  ],
  hinge: [
    {
      lang: 'swift',
      code: `// iOS 27.1+ — API names from Apple's iPhone Duo docs; check Xcode 27.1 for exact signatures.
struct ReaderView: View {
    @State private var tabletop = false

    var body: some View {
        GeometryReader { proxy in
            Content(tabletop: tabletop)
                // proxy.reservedRegion(…) → where the fold is; keep controls out of it
        }
        .onHingeChange { state in   // closed · partially open · fully open
            tabletop = (state == .partiallyOpen)
        }
    }
}`,
    },
  ],
  swNavigation: [
    {
      lang: 'swift',
      code: `struct ContentView: View {
    @State private var path: [Item] = []

    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: Item.self) { DetailView(item: $0) }
        }
    }
}`,
    },
  ],
}

const BY_CID: Record<string, keyof typeof S> = {
  'p.start': 'process',
  'p.foreground': 'process',
  'p.background': 'process',
  'p.killed': 'saveState',
  'a.onCreate': 'activity',
  'a.onStart': 'lifecycleEffects',
  'a.onResume': 'lifecycleEffects',
  'a.onPause': 'lifecycleEffects',
  'a.onStop': 'lifecycleEffects',
  'a.onRestart': 'lifecycleEffects',
  'a.onDestroy': 'saveState',
  'a.onSaveInstanceState': 'saveState',
  'a.onConfigurationChanged': 'config',
  'f.onAttach': 'navigation',
  'f.onCreate': 'navigation',
  'f.onCreateView': 'composition',
  'f.onViewCreated': 'composition',
  'f.onStart': 'lifecycleEffects',
  'f.onResume': 'lifecycleEffects',
  'f.onPause': 'lifecycleEffects',
  'f.onStop': 'lifecycleEffects',
  'f.onDestroyView': 'composition',
  'f.onDestroy': 'navigation',
  'f.onDetach': 'navigation',
  'c.enter': 'composition',
  'c.start': 'lifecycleEffects',
  'c.resume': 'lifecycleEffects',
  'c.pause': 'lifecycleEffects',
  'c.stop': 'lifecycleEffects',
  'c.leave': 'composition',
  'c.recompose': 'recompose',
  'c.folding': 'folding',
  'a.didFinishLaunching': 'swApp',
  'a.inactive': 'scenePhase',
  'a.active': 'scenePhase',
  'a.background': 'scenePhase',
  'a.suspended': 'background',
  'a.willTerminate': 'background',
  'a.jetsam': 'state',
  's.willConnect': 'swApp',
  's.willEnterForeground': 'scenePhase',
  's.didBecomeActive': 'scenePhase',
  's.willResignActive': 'scenePhase',
  's.didEnterBackground': 'scenePhase',
  's.didDisconnect': 'state',
  's.didUpdate': 'size',
  'vc.viewDidLoad': 'appear',
  'vc.viewWillAppear': 'appear',
  'vc.viewIsAppearing': 'appear',
  'vc.viewDidAppear': 'appear',
  'vc.viewWillDisappear': 'appear',
  'vc.viewDidDisappear': 'appear',
  'vc.deinit': 'swNavigation',
  'vc.viewWillTransition': 'size',
  'vc.traitChange': 'size',
  'vc.hinge': 'hinge',
  'sw.onAppear': 'appear',
  'sw.onDisappear': 'appear',
  'sw.body': 'state',
  'sw.hinge': 'hinge',
  'ph.active': 'scenePhase',
  'ph.inactive': 'scenePhase',
  'ph.background': 'scenePhase',
}

export function snippetsFor(cid: string): Snippet[] {
  const key = BY_CID[cid]
  return key ? S[key] : []
}

export const allCids = Object.keys(BY_CID)
