import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/* ── Dataset ─────────────────────────────────────────────────────────────── */

interface EmojiEntry { e: string; n: string; t: string[] }

const DATA: EmojiEntry[] = [
  // Smileys
  { e:'😀', n:'grinning',       t:['smile','happy','grin'] },
  { e:'😂', n:'joy',            t:['laugh','funny','lol','cry'] },
  { e:'😊', n:'blush',          t:['smile','happy','cute','warm'] },
  { e:'😍', n:'heart eyes',     t:['love','crush','beautiful','adore'] },
  { e:'🥰', n:'smiling hearts', t:['love','adore','cute','affection'] },
  { e:'😎', n:'cool',           t:['sunglasses','awesome','rad'] },
  { e:'🤩', n:'star struck',    t:['excited','star','amazing','wow'] },
  { e:'🥺', n:'pleading',       t:['please','beg','cute','puppy','sad'] },
  { e:'😭', n:'sob',            t:['cry','sad','tears','sobbing'] },
  { e:'😢', n:'crying',         t:['sad','tear','unhappy'] },
  { e:'😅', n:'sweat smile',    t:['nervous','awkward','phew','relief'] },
  { e:'😆', n:'laughing',       t:['laugh','happy','haha','xd'] },
  { e:'🤔', n:'thinking',       t:['think','wonder','hmm','ponder'] },
  { e:'🙄', n:'eye roll',       t:['roll','annoyed','whatever','sigh'] },
  { e:'😏', n:'smirk',          t:['smug','sly','flirt','knowing'] },
  { e:'😤', n:'huffing',        t:['angry','frustrated','steam','mad'] },
  { e:'😡', n:'angry',          t:['mad','rage','fury','red'] },
  { e:'🤯', n:'mind blown',     t:['shocked','wow','exploding','crazy'] },
  { e:'🥳', n:'party face',     t:['celebrate','birthday','party','fun'] },
  { e:'😴', n:'sleeping',       t:['sleep','tired','zzz','night'] },
  { e:'🤢', n:'nauseated',      t:['sick','gross','nausea','ill'] },
  { e:'😷', n:'mask',           t:['sick','ill','covid','doctor'] },
  { e:'🥵', n:'hot face',       t:['hot','sweat','heat','burn'] },
  { e:'🥶', n:'cold face',      t:['cold','freezing','chill','ice'] },
  { e:'😇', n:'angel',          t:['innocent','halo','holy','good'] },
  { e:'😈', n:'devil',          t:['evil','naughty','sneaky','mischief'] },
  { e:'💀', n:'skull',          t:['dead','death','halloween','bones'] },
  { e:'👻', n:'ghost',          t:['ghost','spooky','halloween','boo'] },
  { e:'🤖', n:'robot',          t:['robot','ai','machine','bot','tech'] },
  { e:'🎃', n:'pumpkin',        t:['halloween','pumpkin','spooky','fall'] },
  // Hands
  { e:'👋', n:'wave',           t:['wave','hello','bye','hi','greet'] },
  { e:'🤝', n:'handshake',      t:['deal','agreement','shake','partner'] },
  { e:'👍', n:'thumbs up',      t:['like','approve','yes','good','ok','agree'] },
  { e:'👎', n:'thumbs down',    t:['dislike','bad','no','nope','disagree'] },
  { e:'✌️', n:'peace',          t:['peace','v','two','victory'] },
  { e:'🤞', n:'fingers crossed',t:['luck','hope','cross','wish'] },
  { e:'🤘', n:'rock on',        t:['rock','metal','horn','music'] },
  { e:'👏', n:'clap',           t:['clap','applause','bravo','congrats'] },
  { e:'🙌', n:'raising hands',  t:['praise','cheer','yes','celebrate'] },
  { e:'🙏', n:'pray',           t:['thank','please','prayer','namaste','bow'] },
  { e:'💪', n:'muscle',         t:['strong','flex','bicep','power','gym'] },
  { e:'👀', n:'eyes',           t:['look','see','watching','reading','peek'] },
  { e:'🧠', n:'brain',          t:['brain','smart','mind','think','ideas'] },
  // Hearts & symbols
  { e:'❤️', n:'heart',          t:['love','heart','red','romance','like'] },
  { e:'🧡', n:'orange heart',   t:['love','heart','orange','warm'] },
  { e:'💛', n:'yellow heart',   t:['love','heart','yellow','friend','happy'] },
  { e:'💚', n:'green heart',    t:['love','heart','green','nature','health'] },
  { e:'💙', n:'blue heart',     t:['love','heart','blue','calm'] },
  { e:'💜', n:'purple heart',   t:['love','heart','purple','royalty'] },
  { e:'🖤', n:'black heart',    t:['love','heart','black','dark','emo'] },
  { e:'💔', n:'broken heart',   t:['sad','heartbreak','broken','hurt'] },
  { e:'💕', n:'two hearts',     t:['love','cute','hearts','romance'] },
  { e:'💯', n:'100',            t:['hundred','perfect','score','fire','yes'] },
  { e:'🔥', n:'fire',           t:['fire','hot','flame','lit','burn','spicy'] },
  { e:'✨', n:'sparkles',       t:['sparkle','glitter','magic','stars','shiny'] },
  { e:'💥', n:'boom',           t:['explosion','bang','crash','boom','pow'] },
  { e:'💫', n:'dizzy',          t:['star','sparkle','dizzy','magic','spin'] },
  { e:'⭐', n:'star',           t:['star','favorite','rating','gold','shiny'] },
  { e:'🌟', n:'glowing star',   t:['star','bright','glow','shine','twinkle'] },
  { e:'💎', n:'gem',            t:['diamond','gem','jewel','crystal','precious'] },
  { e:'👑', n:'crown',          t:['crown','king','queen','royal','winner'] },
  { e:'🎯', n:'bullseye',       t:['target','aim','goal','dart','perfect'] },
  { e:'⚡', n:'lightning',      t:['lightning','electric','fast','power','bolt'] },
  { e:'🪄', n:'magic wand',    t:['magic','wand','wizard','spell','trick'] },
  { e:'🌈', n:'rainbow',        t:['rainbow','colorful','pride','color','arc'] },
  { e:'☀️', n:'sun',            t:['sun','sunny','bright','warm','day'] },
  { e:'🌙', n:'moon',           t:['moon','night','crescent','sleep','dark'] },
  { e:'🌍', n:'globe',          t:['earth','world','planet','global','map'] },
  { e:'❄️', n:'snowflake',      t:['snow','cold','winter','ice','freeze'] },
  { e:'🌊', n:'wave',           t:['ocean','sea','water','wave','surf','beach'] },
  // Nature & plants
  { e:'🌸', n:'blossom',        t:['flower','pink','spring','sakura','cherry'] },
  { e:'🌺', n:'hibiscus',       t:['flower','tropical','red','hawaii'] },
  { e:'🌻', n:'sunflower',      t:['flower','yellow','sun','happy','summer'] },
  { e:'🌹', n:'rose',           t:['flower','red','love','romance','beauty'] },
  { e:'🌷', n:'tulip',          t:['flower','pink','spring','garden'] },
  { e:'🌿', n:'herb',           t:['plant','green','nature','leaf','grass'] },
  { e:'🍀', n:'clover',         t:['luck','clover','shamrock','irish','green'] },
  { e:'🌲', n:'tree',           t:['tree','pine','forest','nature','woods'] },
  { e:'🌴', n:'palm',           t:['palm','tropical','beach','coconut','summer'] },
  { e:'🌵', n:'cactus',         t:['desert','cactus','plant','dry'] },
  { e:'🍄', n:'mushroom',       t:['mushroom','fungus','mario','forest'] },
  { e:'🦋', n:'butterfly',      t:['butterfly','wings','beautiful','transform'] },
  // Animals
  { e:'🐶', n:'dog',            t:['dog','puppy','pet','cute','woof'] },
  { e:'🐱', n:'cat',            t:['cat','kitten','pet','cute','meow'] },
  { e:'🐻', n:'bear',           t:['bear','animal','cute','panda'] },
  { e:'🐼', n:'panda',          t:['panda','bear','cute','china'] },
  { e:'🦊', n:'fox',            t:['fox','sly','clever','orange','cunning'] },
  { e:'🦁', n:'lion',           t:['lion','roar','king','jungle','strong'] },
  { e:'🐯', n:'tiger',          t:['tiger','stripes','jungle','roar','fierce'] },
  { e:'🦄', n:'unicorn',        t:['unicorn','magic','rainbow','horse','fantasy'] },
  { e:'🐸', n:'frog',           t:['frog','green','ribbit','jump'] },
  { e:'🦉', n:'owl',            t:['owl','wise','night','bird','knowledge'] },
  { e:'🐬', n:'dolphin',        t:['dolphin','ocean','smart','swim','jump'] },
  { e:'🦈', n:'shark',          t:['shark','ocean','fish','danger','teeth'] },
  { e:'🐉', n:'dragon',         t:['dragon','fire','fantasy','mythical','wings'] },
  { e:'🐢', n:'turtle',         t:['turtle','slow','shell','calm','reptile'] },
  // Food & drink
  { e:'🍎', n:'apple',          t:['apple','red','fruit','food','health'] },
  { e:'🍊', n:'orange',         t:['orange','citrus','fruit','vitamin'] },
  { e:'🍋', n:'lemon',          t:['lemon','yellow','sour','citrus'] },
  { e:'🍇', n:'grapes',         t:['grapes','purple','fruit','wine'] },
  { e:'🍓', n:'strawberry',     t:['strawberry','red','sweet','fruit','berry'] },
  { e:'🥑', n:'avocado',        t:['avocado','green','healthy','guacamole'] },
  { e:'🌮', n:'taco',           t:['taco','mexican','food','spicy'] },
  { e:'🍕', n:'pizza',          t:['pizza','food','italian','cheese','slice'] },
  { e:'🍔', n:'burger',         t:['burger','hamburger','food','fast food'] },
  { e:'🍟', n:'fries',          t:['fries','french fries','fast food','potato'] },
  { e:'🍜', n:'noodles',        t:['noodles','ramen','soup','asian','bowl'] },
  { e:'🍣', n:'sushi',          t:['sushi','japanese','fish','rice','roll'] },
  { e:'🍩', n:'donut',          t:['donut','doughnut','sweet','ring','dessert'] },
  { e:'🎂', n:'cake',           t:['cake','birthday','celebrate','sweet','candle'] },
  { e:'🧁', n:'cupcake',        t:['cupcake','sweet','cake','bakery','frosting'] },
  { e:'🍫', n:'chocolate',      t:['chocolate','sweet','candy','cocoa','brown'] },
  { e:'🍦', n:'ice cream',      t:['ice cream','sweet','cold','summer','cone'] },
  { e:'☕', n:'coffee',         t:['coffee','cafe','drink','morning','latte'] },
  { e:'🧋', n:'bubble tea',    t:['boba','tea','drink','bubble','milk tea'] },
  { e:'🍺', n:'beer',           t:['beer','drink','alcohol','cheers','mug'] },
  { e:'🍷', n:'wine',           t:['wine','red wine','drink','alcohol','grape'] },
  { e:'🥂', n:'champagne',      t:['toast','celebrate','cheers','bubbles','new year'] },
  // Activities
  { e:'⚽', n:'soccer',         t:['soccer','football','ball','sport','goal'] },
  { e:'🏀', n:'basketball',     t:['basketball','ball','sport','hoop','nba'] },
  { e:'🎾', n:'tennis',         t:['tennis','ball','sport','racket','match'] },
  { e:'🏊', n:'swimming',       t:['swim','water','sport','pool','lap'] },
  { e:'🚴', n:'cycling',        t:['bike','cycle','ride','sport','bicycle'] },
  { e:'🏋️', n:'weightlifting',  t:['gym','workout','lift','weights','fitness'] },
  { e:'🧘', n:'yoga',           t:['yoga','meditate','calm','stretch','mindful'] },
  { e:'🎮', n:'gaming',         t:['game','controller','play','video game','console'] },
  { e:'🎲', n:'dice',           t:['dice','game','luck','random','roll'] },
  { e:'🎨', n:'art',            t:['art','paint','palette','creative','draw'] },
  { e:'🎵', n:'music note',     t:['music','note','sound','song','tune'] },
  { e:'🎸', n:'guitar',         t:['guitar','music','rock','instrument','band'] },
  { e:'🎤', n:'microphone',     t:['mic','sing','music','karaoke','perform'] },
  { e:'🏆', n:'trophy',         t:['trophy','win','champion','award','gold'] },
  { e:'📚', n:'books',          t:['books','read','study','library','learn'] },
  { e:'✏️', n:'pencil',         t:['pencil','write','draw','edit','sketch'] },
  { e:'🎉', n:'party',          t:['party','celebrate','confetti','tada','fun'] },
  // Travel
  { e:'✈️', n:'airplane',       t:['airplane','fly','travel','flight','trip'] },
  { e:'🚀', n:'rocket',         t:['rocket','space','launch','fast','nasa'] },
  { e:'🚗', n:'car',            t:['car','drive','auto','vehicle','road'] },
  { e:'🚂', n:'train',          t:['train','rail','travel','speed','commute'] },
  { e:'🚢', n:'ship',           t:['ship','boat','cruise','ocean','sail'] },
  { e:'🏖️', n:'beach',          t:['beach','sun','sand','vacation','sea','summer'] },
  { e:'🏔️', n:'mountain',       t:['mountain','peak','climb','snow','hike'] },
  { e:'🌆', n:'city',           t:['city','urban','skyline','buildings','downtown'] },
  { e:'🗺️', n:'map',            t:['map','navigate','explore','travel','directions'] },
  { e:'🏕️', n:'camping',        t:['camp','tent','outdoor','nature','forest'] },
  { e:'🏰', n:'castle',         t:['castle','fairy tale','medieval','fortress','palace'] },
  // Objects
  { e:'💻', n:'laptop',         t:['laptop','computer','tech','work','code'] },
  { e:'📱', n:'phone',          t:['phone','mobile','smartphone','text','call'] },
  { e:'📷', n:'camera',         t:['camera','photo','picture','snap','photography'] },
  { e:'🎁', n:'gift',           t:['gift','present','birthday','wrap','surprise'] },
  { e:'🔑', n:'key',            t:['key','unlock','access','lock','house'] },
  { e:'💡', n:'lightbulb',      t:['idea','light','tip','bright','bulb','inspire'] },
  { e:'🔧', n:'wrench',         t:['wrench','tool','fix','repair','settings'] },
  { e:'⚙️', n:'gear',           t:['gear','settings','cog','mechanism','config'] },
  { e:'📌', n:'pushpin',        t:['pin','map','location','mark','bookmark'] },
  { e:'🗑️', n:'trash',          t:['trash','delete','garbage','bin','remove'] },
  { e:'📅', n:'calendar',       t:['calendar','date','schedule','plan','event'] },
  { e:'⏰', n:'alarm',          t:['alarm','clock','time','wake','reminder'] },
  { e:'💰', n:'money',          t:['money','cash','rich','wealth','dollar','bag'] },
  { e:'📝', n:'memo',           t:['note','memo','write','list','task'] },
  { e:'📧', n:'email',          t:['email','mail','message','letter','inbox'] },
  { e:'🔔', n:'bell',           t:['bell','notification','alert','ring','alarm'] },
  { e:'🏠', n:'house',          t:['home','house','building','live','shelter'] },
  { e:'🎓', n:'graduation',     t:['graduate','school','diploma','cap','degree'] },
  { e:'🔒', n:'lock',           t:['lock','secure','closed','private','safe'] },
  { e:'💬', n:'chat',           t:['chat','talk','message','speech','bubble'] },
  { e:'🔗', n:'link',           t:['link','chain','connect','url','attach'] },
  { e:'📍', n:'location',       t:['pin','location','place','here','map','gps'] },
  // Symbols
  { e:'✅', n:'check',          t:['check','done','yes','complete','ok','correct'] },
  { e:'❌', n:'cross',          t:['no','wrong','error','cancel','delete','x'] },
  { e:'⚠️', n:'warning',        t:['warn','alert','caution','danger','attention'] },
  { e:'❓', n:'question',       t:['question','ask','help','confused','huh'] },
  { e:'❗', n:'exclamation',    t:['exclaim','important','alert','urgent','wow'] },
  { e:'♻️', n:'recycle',        t:['recycle','green','environment','loop','eco'] },
  { e:'🔴', n:'red circle',     t:['red','circle','dot','stop','record'] },
  { e:'🟡', n:'yellow circle',  t:['yellow','circle','dot','caution'] },
  { e:'🟢', n:'green circle',   t:['green','circle','dot','go','active','online'] },
  { e:'🔵', n:'blue circle',    t:['blue','circle','dot','cool'] },
  { e:'⚡', n:'bolt',           t:['lightning','electric','fast','power','bolt','energy'] },
  { e:'🎀', n:'ribbon',         t:['bow','ribbon','pink','cute','gift','pretty'] },
  { e:'⏳', n:'hourglass',      t:['time','wait','hourglass','sand','countdown'] },
  { e:'🚩', n:'red flag',       t:['flag','red','warning','mark','alert'] },
  { e:'➕', n:'plus',           t:['plus','add','more','positive','new'] },
  { e:'💭', n:'thought',        t:['think','thought','idea','wonder','cloud'] },
];

/* ── Hook ────────────────────────────────────────────────────────────────────

   Detects "/" typed in a controlled input/textarea, extracts the search query,
   and returns handlers for the EmojiPicker component.

   Usage:
     const picker = useEmojiPicker(inputRef, value, onChange);
     <EmojiPicker {...picker} />
────────────────────────────────────────────────────────────────────────────── */

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export interface UseEmojiPickerResult {
  isOpen: boolean;
  query: string;
  anchorRect: DOMRect | null;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function useEmojiPicker(
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  value: string,
  onChange: (value: string) => void,
): UseEmojiPickerResult {
  const [triggerIndex, setTriggerIndex] = useState<number | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isMobile) return;
    const el = inputRef.current;
    // Avoid selectionStart — React's controlled-input DOM patching can reset it
    // to 0 before effects fire, causing lastIndexOf to search an empty string.
    // Instead search the full value for the last "/" with no whitespace after it.
    const slashIdx = value.lastIndexOf('/');

    if (slashIdx === -1 || /[\s\n]/.test(value.slice(slashIdx + 1))) {
      setTriggerIndex(null);
      return;
    }
    setTriggerIndex(slashIdx);
    setAnchorRect(el ? el.getBoundingClientRect() : null);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = triggerIndex !== null ? value.slice(triggerIndex + 1) : '';

  const onSelect = useCallback((emoji: string) => {
    if (triggerIndex === null) return;
    const el = inputRef.current;
    // Replace from "/" to end of value. The picker's search input has focus
    // when this fires, so el.selectionStart on the original field is stale.
    const newValue = value.slice(0, triggerIndex) + emoji;
    onChange(newValue);
    setTriggerIndex(null);
    setAnchorRect(null);
    if (el) {
      const newPos = triggerIndex + emoji.length;
      setTimeout(() => { el.focus(); el.setSelectionRange(newPos, newPos); }, 0);
    }
  }, [triggerIndex, value, onChange, inputRef]);

  const onClose = useCallback(() => {
    setTriggerIndex(null);
    inputRef.current?.focus();
  }, [inputRef]);

  return { isOpen: triggerIndex !== null, query, anchorRect, onSelect, onClose };
}

/* ── Component ───────────────────────────────────────────────────────────────

   Portal-based emoji picker popup. Pass useEmojiPicker()'s return value
   directly as props.
────────────────────────────────────────────────────────────────────────────── */

export interface EmojiPickerProps {
  isOpen: boolean;
  query: string;
  anchorRect: DOMRect | null;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const COLS = 8;
const POPUP_W = 288;
const POPUP_H = 296;

export function EmojiPicker({ isOpen, query, anchorRect, onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync search field with external query (user typing after "/")
  useEffect(() => { setSearch(query); }, [query]);

  // On open: reset selection and focus the search input
  useEffect(() => {
    if (!isOpen) return;
    setActiveIdx(0);
    const t = setTimeout(() => searchRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Reset active index when search changes
  useEffect(() => { setActiveIdx(0); }, [search]);

  const filtered = search.trim()
    ? DATA.filter((d) => {
        const q = search.toLowerCase();
        return d.n.includes(q) || d.t.some((tag) => tag.includes(q));
      })
    : DATA;

  // Scroll active cell into view
  useEffect(() => {
    const btn = gridRef.current?.children[activeIdx] as HTMLElement | undefined;
    btn?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Click outside → close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIdx]) onSelect(filtered[activeIdx].e);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + COLS, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - COLS, 0));
        break;
    }
  };

  if (!isOpen || !anchorRect) return null;

  const vh = window.visualViewport?.height ?? window.innerHeight;
  const vw = window.innerWidth;
  const spaceBelow = vh - anchorRect.bottom;
  const rawTop = spaceBelow > POPUP_H + 8 ? anchorRect.bottom + 6 : anchorRect.top - POPUP_H - 6;
  const top = Math.max(8, Math.min(rawTop, vh - POPUP_H - 8));
  const left = Math.max(8, Math.min(anchorRect.left, vw - POPUP_W - 8));

  return createPortal(
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{ position: 'fixed', top, left, width: POPUP_W, zIndex: 9999 }}
      className={cn(
        'rounded-2xl overflow-hidden',
        'bg-white/95 backdrop-blur-xl',
        'border border-white/60',
        'shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]',
      )}
    >
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-black/[0.06]">
        <svg
          className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0"
          viewBox="0 0 16 16" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="6.5" cy="6.5" r="4.5" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji…"
          className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-lg leading-none text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="p-1.5 overflow-y-auto" style={{ maxHeight: POPUP_H - 44 }}>
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">
            No results for &ldquo;{search}&rdquo;
          </p>
        ) : (
          <div
            ref={gridRef}
            className="grid"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {filtered.map((entry, idx) => (
              <button
                key={entry.e + idx}
                type="button"
                title={entry.n}
                onClick={() => onSelect(entry.e)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={cn(
                  'w-8 h-8 text-[18px] flex items-center justify-center rounded-lg transition-colors',
                  idx === activeIdx ? 'bg-primary/10' : 'hover:bg-black/[0.05]',
                )}
              >
                {entry.e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
