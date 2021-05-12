onmessage = function(e) {
  function proficiency(lvl) {
    return 1 + Math.ceil(lvl / 4);
  }

  function to_hit(lvl, dex_opt) {
    return proficiency(lvl) + dex_mod(lvl, dex_opt);
  }

  function dex_mod(lvl, dex_opt) {
    return 3 + (!dex_opt && (lvl >= 12)) +
               (!dex_opt && (lvl >= 16)) +
               (dex_opt && (lvl >= 4)) +
               (dex_opt && (lvl >= 8));
  }
  function wis_mod(lvl, dex_opt) {
    return 3 + (dex_opt && (lvl >= 12)) +
               (dex_opt && (lvl >= 16)) +
               (!dex_opt && (lvl >= 4)) +
               (!dex_opt && (lvl >= 8));
  }

  function save_dc(lvl, dex_opt) {
    return 8 +
           proficiency(lvl) +
           wis_mod(lvl, dex_opt);
  }

  let dx = (function() {
    let base = Math.pow(2, 16);
    return function(sides) {
      let v = new Uint16Array(1);
      self.crypto.getRandomValues(v);
      return 1 + Math.floor(1.0 * sides * v[0] / base);
    };
  })();

  let d20 = function() { return dx(20); };
  let ad20 = function() { return Math.max(d20(), d20()); };

  function monk_die(lvl) {
    if (lvl < 5) return 4;
    if (lvl < 11) return 6;
    if (lvl < 17) return 8;
    return 10;
  }

  function damage_roll(lvl, dex_opt, crit) {
    return dex_mod(lvl, dex_opt) + dx(monk_die(lvl)) + (crit ? dx(monk_die(lvl)) : 0);
  }

  function run_trial(monk_lvl, dex_opt, ac, con_mod) {
    let ret = {'ki_spent': 0,
               'stunned': false,
               'damage': 0};
    let target_number = Math.min(20, Math.max(2, ac - to_hit(monk_lvl, dex_opt)));
    let enemy_fails_under = save_dc(monk_lvl, dex_opt) - con_mod;

    // Strategy: attack twice, if stunned, use bonus action to attack, it not
    // flurry and continue trying to stun.
    for (let i = 1; i <= 4; ++i) {
      let stop_here = false;
      if (i == 3) {
        if (ret['stunned']) {
          stop_here = true;
        } else {
         ++ret['ki_spent'];
        }
      }
      let r1 = ret['stunned'] ? ad20() : d20();
      if (r1 >= target_number) {
        ret['damage'] += damage_roll(monk_lvl, dex_opt, r1 == 20);
        if (!ret['stunned']) {
          ret['stunned'] ||= (d20() < enemy_fails_under);
          ++ret['ki_spent'];
        }
      }
      if (stop_here) { break; } // no 4th attack if we stun in 1 or 2
    }
    return ret;
  }

  function run_multi_trial(trials, monk_lvl, dex_opt, ac, con_mod) {
    let result = {
      'avg_ki_spent_for_stun': 0,
      'stunned_cnt': 0,
      'avg_damage': 0,
      'ki_spent_histo': {1:0, 2:0, 3:0, 4:0, 5:0, 'f':0},
      'damage_histo': {},
      'trials': trials
    };
    for(let i = 0; i < trials; ++i) {
      let r = run_trial(monk_lvl, dex_opt, ac, con_mod);
      if (r['stunned']) {
        result['stunned_cnt']++;
        result['avg_ki_spent_for_stun'] += r['ki_spent'];
        ++result['ki_spent_histo'][r['ki_spent']];
      } else {
        ++result['ki_spent_histo']['f'];
      }
      result['avg_damage'] += r['damage'];
      if (!(r['damage'] in result['damage_histo'])) {
        result['damage_histo'][r['damage']] = 0;
      }
      result['damage_histo'][r['damage']]++;
    }
    result['avg_ki_spent_for_stun'] /= result['stunned_cnt'];
    result['stun_rate'] = result['stunned_cnt'] / trials;
    result['avg_damage'] /= trials;
    return result;
  }

  return (function() {
    //console.log(e);
    let d = e.data;
    //console.log(d);
    let r = run_multi_trial(d.trials, d.monk_lvl, d.dex_opt, d.ac, d.con_mod);
    postMessage(r);
  })();
}
